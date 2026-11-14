/* ArpuPlus Day 2 workbook: fill on any phone, export as PDF.
 * Every position below is in PDF points (page = 390 x 780 pt, origin top-left),
 * measured from the original workbook PDF, so the web page and the exported
 * PDF line up with the design exactly.
 *
 * Growing boxes: when an answer needs more room, the page is cut through the
 * middle of that row of boxes (where everything runs straight up and down) and
 * a thin slice of the design is stretched to the extra height. The box, its
 * card and everything below simply move down, on screen and in the PDF. */
(function () {
  'use strict';

  var PW = 390, PH = 780, NUM_PAGES = 4;
  var KEY = 'arpuplus-day2-workbook-v1';
  var INK = '#1b1f2a';
  var FF = '"DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", "Geeza Pro", Tahoma, sans-serif';
  var FONT = 12, LH = FONT * 1.3, PADX = 7;

  var FIELDS = [
    { page: 1, name: 'name',         label: 'My name', x: 27, y: 280.28, w: 336, h: 32 },
    { page: 1, name: 'team',         label: 'My team', x: 27, y: 344.78, w: 336, h: 32 },
    { page: 1, name: 'date',         label: 'Date',    x: 27, y: 409.28, w: 336, h: 32 },
    { page: 2, name: 'p1_task',      label: 'One recurring task I can drop, delegate or redesign', x: 43, y: 257.03, w: 304, h: 70, multi: true },
    { page: 2, name: 'p1_blocks',    label: 'When my two strategy blocks will be', x: 43, y: 363.97, w: 304, h: 56, multi: true },
    { page: 2, name: 'p1_interrupt', label: 'What is allowed to interrupt them',   x: 43, y: 456.91, w: 304, h: 56, multi: true },
    { page: 2, name: 'p1_notes',     label: 'Additional notes to remember from this part', x: 43, y: 565.78, w: 304, h: 114, multi: true },
    { page: 3, name: 'kpi_goal',     label: 'The team goal it supports',       x: 43, y: 224.42, w: 304, h: 42, multi: true },
    { page: 3, name: 'kpi_kpi',      label: 'The KPI (outcome, not activity)', x: 43, y: 303.36, w: 304, h: 42, multi: true },
    { page: 3, name: 'kpi_base',     label: 'Baseline', x: 43,  y: 382.3, w: 92, h: 30 },
    { page: 3, name: 'kpi_target',   label: 'Target',   x: 149, y: 382.3, w: 92, h: 30 },
    { page: 3, name: 'kpi_date',     label: 'By when',  x: 255, y: 382.3, w: 92, h: 30 },
    { page: 3, name: 'kpi_lead',     label: 'Leading indicator', x: 43, y: 449.23, w: 304, h: 42, multi: true },
    { page: 3, name: 'kpi_guard',    label: 'Guardrail',         x: 43, y: 528.17, w: 304, h: 42, multi: true },
    { page: 3, name: 'kpi_review',   label: 'Review rhythm',     x: 43, y: 607.11, w: 304, h: 30 }
  ];

  // Replaces the iPhone-only instructions printed on pages 1 and 4.
  var NOTES = [
    { page: 1, x: 33, y: 466, w: 326, h: 126, bg: '#262b38', padX: 7.3, padY: 3.7, width: 300, blocks: [
      { text: 'How to use this workbook', weight: 700, size: 12, lh: 18, color: '#f6f2ec' },
      { text: '1. Tap any white box to type your answers.', weight: 400, size: 11.5, lh: 18, color: '#d9d2c7' },
      { text: '2. Your answers save automatically on this phone.', weight: 400, size: 11.5, lh: 18, color: '#d9d2c7' },
      { text: '3. When you finish, tap Export PDF at the bottom to save or share your copy.', weight: 400, size: 11.5, lh: 18, color: '#d9d2c7' }
    ] },
    { page: 4, x: 22, y: 128, w: 346, h: 36, bg: '#f6f2ec', padX: 2.3, padY: 0.6, width: 341, blocks: [
      { text: 'Tap Draw under the box, then draw anywhere inside it with your finger. Tap Done to stop and scroll again.', weight: 400, size: 11.5, lh: 16, color: '#5f636c' }
    ] }
  ];

  var SK = { page: 4, x: 26, y: 175, w: 338, h: 516 };   // inside the dashed sketch box
  var TOOLS = { page: 4, x: 24, y: 702, w: 342, h: 30 };
  var PEN = { w: 2.2, c: INK };

  /* ---------- rows of boxes (boxes side by side grow together) ---------- */
  var ROWS = [];
  FIELDS.forEach(function (f) {
    var row = null;
    ROWS.forEach(function (r) { if (r.page === f.page && r.y === f.y) row = r; });
    if (!row) {
      var mid = f.y + f.h / 2;
      // pages/strip-<page>-<key>.png: a 2pt slice of the page around `mid`, at 3x
      row = { page: f.page, y: f.y, h: f.h, mid: mid, key: Math.floor(mid * 3 + 0.5), fields: [], extra: 0 };
      ROWS.push(row);
    }
    row.fields.push(f);
    f.row = row;
    f.padY = f.multi ? 5 : (f.h - LH) / 2;   // one-line boxes: first line centred like before
  });
  // Fetch every stretch slice now (2.4 KB in total) so a growing box never
  // waits on the network and flashes the dark background behind it.
  var preloaded = ROWS.map(function (r) {
    var im = new Image();
    im.src = 'pages/strip-' + r.page + '-' + r.key + '.png';
    return im;
  });
  function rowsOn(p) { return ROWS.filter(function (r) { return r.page === p; }); }
  function offsetFn(rows, prop) {
    return function (y) {
      var s = 0;
      rows.forEach(function (r) { if (r.mid < y) s += r[prop]; });
      return s;
    };
  }

  /* ---------- state ---------- */
  var state = { fields: {}, strokes: [] };
  var storageOk = true;
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state.fields = saved.fields || {};
      state.strokes = Array.isArray(saved.strokes) ? saved.strokes : [];
    }
  } catch (e) { storageOk = false; }

  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; }
      catch (e) { storageOk = false; }
      setStatus();
    }, 250);
  }

  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $('status');
  function setStatus() {
    statusEl.innerHTML = storageOk
      ? '<b>✓ Saved on this phone</b>'
      : '<b>Can’t save on this phone.</b> Export before you close this page.';
  }

  /* ---------- helpers ---------- */
  function U(v) { return 'calc(var(--u) * ' + v + 'px)'; }
  function place(elm, x, y, w, h) {
    elm.style.left = U(x); elm.style.top = U(y);
    elm.style.width = U(w); elm.style.height = U(h);
  }
  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- build the pages ---------- */
  var book = $('book');
  var pages = [];
  var items = []; // things that move down when a box above them grows
  for (var i = 1; i <= NUM_PAGES; i++) {
    var pEl = el('section', 'page', book);
    pEl.setAttribute('aria-label', 'Page ' + i);
    pEl.style.background = i === 1 ? '#1b1f2a' : '#f6f2ec'; // page colour while images load
    pages.push({ n: i, el: pEl, bg: el('div', 'bg', pEl), sig: null });
  }

  NOTES.forEach(function (n) {
    var box = el('div', 'abs note', pages[n.page - 1].el);
    box.style.background = n.bg;
    box.style.padding = U(n.padY) + ' 0 0 ' + U(n.padX);
    var inner = el('div', '', box);
    inner.style.width = U(n.width);
    n.blocks.forEach(function (b) {
      var d = el('div', '', inner);
      d.textContent = b.text;
      d.style.font = b.weight + ' ' + U(b.size) + ' / ' + U(b.lh) + ' ' + FF;
      d.style.color = b.color;
    });
    items.push({ el: box, page: n.page, x: n.x, y: n.y, w: n.w, h: n.h });
  });

  var inputs = [];
  FIELDS.forEach(function (f) {
    var ta = el('textarea', 'f', pages[f.page - 1].el);
    ta.name = f.name;
    ta.rows = 1;
    ta.dir = 'auto';
    ta.setAttribute('aria-label', f.label);
    ta.setAttribute('autocomplete', f.name === 'name' ? 'name' : 'off');
    ta.spellcheck = true;
    ta.style.padding = U(f.padY) + ' ' + U(PADX);
    if (!f.multi) ta.setAttribute('enterkeyhint', 'next');
    ta.value = state.fields[f.name] || '';
    ta.addEventListener('input', function () {
      if (!f.multi && /[\r\n]/.test(ta.value)) ta.value = ta.value.replace(/\s*[\r\n]+\s*/g, ' ');
      state.fields[f.name] = ta.value;
      relayout(f.page);
      save();
    });
    f.el = ta;
    inputs.push(ta);
  });
  FIELDS.forEach(function (f, idx) {
    if (f.multi) return;
    f.el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var nx = inputs[idx + 1]; if (nx) nx.focus(); else f.el.blur(); }
    });
  });

  /* ---------- sketch (page 4) ---------- */
  var sk = el('canvas', 'abs', pages[SK.page - 1].el);
  sk.id = 'sketch';
  sk.setAttribute('aria-label', 'Sketch space. Tap Draw first, then draw with your finger.');
  items.push({ el: sk, page: SK.page, x: SK.x, y: SK.y, w: SK.w, h: SK.h });
  var skCtx = sk.getContext('2d');

  var tools = el('div', 'abs tools', pages[TOOLS.page - 1].el);
  items.push({ el: tools, page: TOOLS.page, x: TOOLS.x, y: TOOLS.y, w: TOOLS.w, h: TOOLS.h });
  var drawBtn = el('button', 'primary', tools); drawBtn.type = 'button';
  var undoBtn = el('button', '', tools); undoBtn.type = 'button'; undoBtn.textContent = 'Undo';
  var wipeBtn = el('button', '', tools); wipeBtn.type = 'button'; wipeBtn.textContent = 'Clear drawing';

  var drawing = false, cur = null;
  function setDrawing(on) {
    drawing = on;
    sk.classList.toggle('on', on);
    drawBtn.classList.toggle('on', on);
    drawBtn.textContent = on ? '✓ Done' : '✏️ Draw';
  }
  setDrawing(false);
  drawBtn.addEventListener('click', function () { setDrawing(!drawing); });
  undoBtn.addEventListener('click', function () { state.strokes.pop(); redrawSketch(); save(); });

  // Two-tap confirm inside the page. Browser pop-ups (confirm()) are silently
  // blocked in many in-app browsers (WhatsApp, Instagram...) and in some phones.
  function tapTwice(btn, armedText, action) {
    var idle = btn.textContent, timer = null;
    function reset() { clearTimeout(timer); timer = null; btn.textContent = idle; btn.classList.remove('armed'); }
    btn.addEventListener('click', function () {
      if (timer) { reset(); action(); return; }
      btn.textContent = armedText;
      btn.classList.add('armed');
      timer = setTimeout(reset, 3000);
    });
  }
  tapTwice(wipeBtn, 'Tap again to clear', function () { state.strokes = []; redrawSketch(); save(); });

  function drawStrokes(ctx, strokes, scale) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes.forEach(function (s) {
      var pts = s.p;
      if (!pts || !pts.length) return;
      ctx.strokeStyle = ctx.fillStyle = s.c || PEN.c;
      ctx.lineWidth = s.w || PEN.w;
      if (pts.length < 3) {
        ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], (s.w || PEN.w) / 2, 0, Math.PI * 2); ctx.fill();
        if (pts.length === 2) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.stroke(); }
        return;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length - 1; k++) {
        var mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
      }
      var last = pts[pts.length - 1];
      ctx.lineTo(last[0], last[1]);
      ctx.stroke();
    });
  }
  function redrawSketch() {
    var r = sk.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var wpx = Math.max(1, Math.round(r.width * dpr)), hpx = Math.max(1, Math.round(r.height * dpr));
    if (sk.width !== wpx || sk.height !== hpx) { sk.width = wpx; sk.height = hpx; }
    skCtx.setTransform(1, 0, 0, 1, 0, 0);
    skCtx.clearRect(0, 0, sk.width, sk.height);
    drawStrokes(skCtx, state.strokes, wpx / SK.w);
  }
  function toPt(e) {
    var r = sk.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * SK.w, y = (e.clientY - r.top) / r.height * SK.h;
    return [Math.round(Math.max(0, Math.min(SK.w, x)) * 10) / 10, Math.round(Math.max(0, Math.min(SK.h, y)) * 10) / 10];
  }
  sk.addEventListener('pointerdown', function (e) {
    if (!drawing) return;
    e.preventDefault();
    try { sk.setPointerCapture(e.pointerId); } catch (_) {}
    cur = { w: PEN.w, c: PEN.c, p: [toPt(e)] };
    state.strokes.push(cur);
    redrawSketch();
  });
  sk.addEventListener('pointermove', function (e) {
    if (!cur) return;
    e.preventDefault();
    var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (!evs.length) evs = [e];
    evs.forEach(function (ev) { cur.p.push(toPt(ev)); });
    redrawSketch();
  });
  function endStroke() { if (cur) { cur = null; save(); } }
  sk.addEventListener('pointerup', endStroke);
  sk.addEventListener('pointercancel', endStroke);

  /* ---------- layout: growing boxes ---------- */
  var UPX = 1; // CSS px per PDF point

  // Page background = slices of the page image, with a stretched 2pt strip
  // wherever a row of boxes grew.
  function drawBg(P, cuts) {
    P.bg.innerHTML = '';
    var url = 'url(pages/page-' + P.n + '.png)';
    function seg(a, b, off) {
      var d = el('div', 'seg', P.bg);
      d.style.top = U(a + off); d.style.height = U(b - a);
      d.style.backgroundImage = url;
      d.style.backgroundPosition = '0 ' + U(-a);
    }
    var a = 0, off = 0;
    cuts.forEach(function (c) {
      seg(a, c.mid, off);
      var s = el('div', 'strip', P.bg);
      s.style.top = 'calc(var(--u) * ' + (c.mid + off) + 'px - 1px)';
      s.style.height = 'calc(var(--u) * ' + c.extra + 'px + 2px)';
      s.style.backgroundImage = 'url(pages/strip-' + P.n + '-' + c.key + '.png)';
      off += c.extra; a = c.mid;
    });
    seg(a, PH, off);
  }

  function relayout(pn) {
    var P = pages[pn - 1];
    var rows = rowsOn(pn);
    rows.forEach(function (r) {
      var need = 0;
      r.fields.forEach(function (f) {
        f.el.style.height = '0px';
        need = Math.max(need, f.el.scrollHeight / UPX);
      });
      // a new line adds ~15pt, so ignore sub-pixel rounding noise
      r.extra = need - r.h > 2 ? Math.ceil(need - r.h) : 0;
    });
    var off = offsetFn(rows, 'extra');
    var total = 0;
    rows.forEach(function (r) { total += r.extra; });
    P.el.style.height = U(PH + total);
    rows.forEach(function (r) {
      r.fields.forEach(function (f) { place(f.el, f.x, f.y + off(f.y), f.w, f.h + r.extra); });
    });
    items.forEach(function (it) { if (it.page === pn) place(it.el, it.x, it.y + off(it.y), it.w, it.h); });
    var cuts = rows.filter(function (r) { return r.extra > 0; }).sort(function (a, b) { return a.mid - b.mid; });
    var sig = cuts.map(function (c) { return c.key + ':' + c.extra; }).join('|') || 'flat';
    if (sig !== P.sig) { P.sig = sig; drawBg(P, cuts); }
  }

  var lastWidth = 0;
  function layout(force) {
    var w = book.clientWidth || PW;
    if (!force && w === lastWidth) return;
    lastWidth = w;
    UPX = w / PW;
    document.documentElement.style.setProperty('--u', String(UPX));
    for (var p = 1; p <= NUM_PAGES; p++) relayout(p);
    redrawSketch();
  }
  if (window.ResizeObserver) new ResizeObserver(function () { layout(false); }).observe(book);
  window.addEventListener('resize', function () { layout(false); });
  layout(true);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(true); });

  // iPhone zooms the page whenever a small text box gets focus; stop that
  // (pinch-zoom still works on iOS).
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    var vp = document.querySelector('meta[name=viewport]');
    vp.setAttribute('content', vp.getAttribute('content') + ', maximum-scale=1');
  }

  // Hide the bottom bar while typing so it doesn't sit on top of the keyboard.
  var bar = $('bar');
  document.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('f')) bar.classList.add('hidden'); });
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (!(a && a.classList && a.classList.contains('f'))) bar.classList.remove('hidden');
    }, 50);
  });

  /* ---------- clear everything ---------- */
  tapTwice($('clearAll'), 'Tap again to clear everything', function () {
    state = { fields: {}, strokes: [] };
    inputs.forEach(function (inp) { inp.value = ''; });
    layout(true);
    save();
  });

  /* ---------- PDF export ---------- */
  var pdfLibPromise = null;
  function loadPdfLib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (!pdfLibPromise) {
      pdfLibPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'vendor/pdf-lib.min.js';
        s.onload = function () { resolve(window.PDFLib); };
        s.onerror = function () { pdfLibPromise = null; reject(new Error('Could not load the PDF tool.')); };
        document.head.appendChild(s);
      });
    }
    return pdfLibPromise;
  }
  setTimeout(function () { loadPdfLib().catch(function () {}); }, 4000);

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('400 12px "DM Sans"'),
      document.fonts.load('700 12px "DM Sans"')
    ]).catch(function () {});
  }

  function fontStr(size, weight) { return (weight || 400) + ' ' + size + 'px ' + FF; }
  function isRtl(text) {
    var m = text.match(/[A-Za-zÀ-ɏ]|[֐-ࣿיִ-﷿ﹰ-﻿]/);
    return !!m && /[֐-ࣿיִ-﷿ﹰ-﻿]/.test(m[0]);
  }
  function wrap(ctx, text, maxW) {
    var out = [];
    text.split(/\r?\n/).forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); return; }
      var line = '';
      words.forEach(function (word) {
        var test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width <= maxW) { line = test; return; }
        if (line) out.push(line);
        // a single word longer than the box: break it by characters
        line = '';
        Array.from(word).forEach(function (ch) {
          if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ''; }
          line += ch;
        });
      });
      out.push(line);
    });
    while (out.length && out[out.length - 1] === '') out.pop();
    return out;
  }
  // Baseline of a line placed like CSS does: centred inside its line box.
  function baseline(ctx, size, lineTop, lh) {
    var m = ctx.measureText('Hg');
    var a = m.fontBoundingBoxAscent || size * 0.99, d = m.fontBoundingBoxDescent || size * 0.31;
    return lineTop + (lh - (a + d)) / 2 + a;
  }
  // Canvas for a w x h pt area; 4 px per pt, less for very tall areas so
  // phones stay under their canvas size limit.
  function makeCanvas(w, h) {
    var s = Math.max(1, Math.min(4, Math.sqrt(12e6 / (w * h))));
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * s); c.height = Math.ceil(h * s);
    c.ptScale = s;
    var ctx = c.getContext('2d');
    ctx.scale(s, s);
    ctx.textBaseline = 'alphabetic';
    return c;
  }
  var measureCtx = document.createElement('canvas').getContext('2d');

  function answerText(f) {
    var v = state.fields[f.name] || '';
    return f.multi ? v : v.replace(/\s*[\r\n]+\s*/g, ' ');
  }
  function answerLines(ctx, f, size) {
    ctx.font = fontStr(size);
    return wrap(ctx, answerText(f), f.w - 2 * PADX);
  }

  function answerCanvas(f, H) {
    var text = answerText(f);
    var c = makeCanvas(f.w, H), ctx = c.getContext('2d');
    var rtl = isRtl(text);
    ctx.fillStyle = INK;
    ctx.direction = rtl ? 'rtl' : 'ltr';
    ctx.textAlign = rtl ? 'right' : 'left';
    var tx = rtl ? f.w - PADX : PADX;
    var size = FONT, lines = answerLines(ctx, f, size);
    // the box was already grown to fit; shrinking is only a safety net
    while (lines.length * size * 1.3 + 2 * f.padY > H + 0.5 && size > 6) {
      size -= 0.5; lines = answerLines(ctx, f, size);
    }
    var lh = size * 1.3;
    lines.forEach(function (ln, k) { ctx.fillText(ln, tx, baseline(ctx, size, f.padY + k * lh, lh)); });
    return c;
  }

  function noteCanvas(n) {
    var c = makeCanvas(n.w, n.h), ctx = c.getContext('2d');
    ctx.fillStyle = n.bg; ctx.fillRect(0, 0, n.w, n.h);
    var top = n.padY;
    n.blocks.forEach(function (b) {
      ctx.font = fontStr(b.size, b.weight);
      ctx.fillStyle = b.color;
      wrap(ctx, b.text, n.width).forEach(function (ln) {
        ctx.fillText(ln, n.padX, baseline(ctx, b.size, top, b.lh));
        top += b.lh;
      });
    });
    return c;
  }

  function fileName() {
    var who = (state.fields.name || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').trim().slice(0, 40);
    return 'ArpuPlus Day 2 Workbook' + (who ? ' - ' + who : '') + '.pdf';
  }

  function buildPdf() {
    var L;
    return Promise.all([loadPdfLib(), fontsReady()]).then(function (r) {
      L = r[0];
      return fetch('workbook.pdf', { cache: 'no-cache' });
    }).then(function (res) {
      if (!res.ok) throw new Error('Could not load the workbook file (' + res.status + ').');
      return res.arrayBuffer();
    }).then(function (bytes) {
      return L.PDFDocument.load(bytes);
    }).then(function (src) {
      // How much each row of boxes must grow in the PDF to fit its answer.
      ROWS.forEach(function (r) {
        var need = 0;
        r.fields.forEach(function (f) {
          if (!answerText(f).trim()) return;
          need = Math.max(need, answerLines(measureCtx, f, FONT).length * LH + 2 * f.padY);
        });
        r.pdfExtra = need - r.h > 0.5 ? Math.ceil(need - r.h) : 0;
      });
      return L.PDFDocument.create().then(function (out) {
        return out.embedPages(src.getPages()).then(function (embedded) {
          var jobs = [];
          for (var pn = 1; pn <= NUM_PAGES; pn++) {
            (function (pn) {
              var rows = rowsOn(pn), E = embedded[pn - 1];
              var total = 0;
              rows.forEach(function (r) { total += r.pdfExtra; });
              var H = PH + total, off = offsetFn(rows, 'pdfExtra');
              var page = out.addPage([PW, H]);

              // the design, cut and stretched where rows grew
              var cuts = rows.filter(function (r) { return r.pdfExtra > 0; }).sort(function (a, b) { return a.mid - b.mid; });
              var clipped = function (x, y, w, h, draw) {
                page.pushOperators(L.pushGraphicsState(), L.rectangle(x, y, w, h), L.clip(), L.endPath());
                draw();
                page.pushOperators(L.popGraphicsState());
              };
              if (!cuts.length) {
                page.drawPage(E, { x: 0, y: 0 });
              } else {
                var a = 0, o = 0;
                var band = function (from, to, o, padTop, padBottom) {
                  var top = H - (from + o) + padTop, bottom = H - (to + o) - padBottom;
                  clipped(0, bottom, PW, top - bottom, function () { page.drawPage(E, { x: 0, y: H - PH - o }); });
                };
                cuts.forEach(function (c) {
                  band(a, c.mid, o, a ? 0.5 : 0, 0.5);
                  // stretch the 2pt slice [mid-1, mid+1] to the extra height
                  var k = c.pdfExtra / 2, bottom = H - (c.mid + o + c.pdfExtra);
                  clipped(0, bottom - 0.5, PW, c.pdfExtra + 1, function () {
                    page.drawPage(E, { x: 0, y: bottom - k * (PH - c.mid - 1), xScale: 1, yScale: k });
                  });
                  o += c.pdfExtra; a = c.mid;
                });
                band(a, PH, o, 0.5, 0);
              }

              var put = function (x, y, w, h, canvas) {
                jobs.push(out.embedPng(canvas.toDataURL('image/png')).then(function (img) {
                  page.drawImage(img, { x: x, y: H - y - h, width: w, height: h });
                }));
              };
              NOTES.forEach(function (n) { if (n.page === pn) put(n.x, n.y + off(n.y), n.w, n.h, noteCanvas(n)); });
              rows.forEach(function (r) {
                r.fields.forEach(function (f) {
                  if (answerText(f).trim()) put(f.x, f.y + off(f.y), f.w, f.h + r.pdfExtra, answerCanvas(f, f.h + r.pdfExtra));
                });
              });
              if (pn === SK.page && state.strokes.length) {
                var c = makeCanvas(SK.w, SK.h);
                drawStrokes(c.getContext('2d'), state.strokes, c.ptScale);
                put(SK.x, SK.y + off(SK.y), SK.w, SK.h, c);
              }
            })(pn);
          }
          return Promise.all(jobs).then(function () {
            var who = (state.fields.name || '').trim();
            out.setTitle('ArpuPlus Leadership Program · Day 2 Workbook' + (who ? ' · ' + who : ''));
            out.setAuthor('Red Rock International');
            out.setCreator('ArpuPlus Day 2 Workbook');
            out.setCreationDate(new Date());
            out.setModificationDate(new Date());
            return out.save();
          });
        });
      });
    });
  }
  window.__buildWorkbookPdf = buildPdf; // used by automated checks

  var lastBlob = null, lastName = '';
  function download() {
    var url = URL.createObjectURL(lastBlob);
    var a = document.createElement('a');
    a.href = url; a.download = lastName; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  var exportBtn = $('export'), sheetBg = $('sheetBg'), shareBtn = $('share');
  var canShareFiles = false;
  try {
    canShareFiles = !!(navigator.canShare && window.File &&
      navigator.canShare({ files: [new File(['x'], 'x.pdf', { type: 'application/pdf' })] }));
  } catch (e) { canShareFiles = false; }
  var READY_TEXT = canShareFiles
    ? 'It should be downloading now. You can also share it straight to WhatsApp or email. If nothing downloaded, open this link in Chrome or Safari and try again.'
    : 'It should be downloading now. If nothing downloaded, open this link in Chrome or Safari and try again.';
  // In-page panel instead of alert(), which in-app browsers often block.
  function openSheet(title, text, ok) {
    $('sheetTitle').textContent = title;
    $('sheetText').textContent = text;
    shareBtn.style.display = ok && canShareFiles ? '' : 'none';
    $('again').style.display = ok ? '' : 'none';
    sheetBg.classList.add('open');
  }

  exportBtn.addEventListener('click', function () {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Preparing…';
    buildPdf().then(function (bytes) {
      lastBlob = new Blob([bytes], { type: 'application/pdf' });
      lastName = fileName();
      download();
      openSheet('Your PDF is ready', READY_TEXT, true);
    }).catch(function (err) {
      openSheet('The PDF couldn’t be made',
        ((err && err.message) ? err.message + ' ' : '') + 'Check your internet connection and tap Export PDF again. Your answers are still saved.', false);
    }).then(function () {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export PDF';
    });
  });
  $('again').addEventListener('click', function () { if (lastBlob) download(); });
  $('close').addEventListener('click', function () { sheetBg.classList.remove('open'); });
  sheetBg.addEventListener('click', function (e) { if (e.target === sheetBg) sheetBg.classList.remove('open'); });
  shareBtn.addEventListener('click', function () {
    if (!lastBlob) return;
    var file = new File([lastBlob], lastName, { type: 'application/pdf' });
    navigator.share({ files: [file], title: lastName }).catch(function (e) {
      if (e && e.name !== 'AbortError') $('sheetText').textContent = 'Sharing isn’t available in this browser. Tap Download again instead.';
    });
  });

  setStatus();
})();
