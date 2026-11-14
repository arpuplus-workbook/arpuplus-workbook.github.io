/* ArpuPlus Day 2 workbook: fill on any phone, export as PDF.
 * Every position below is in PDF points (page = 390 x 780 pt, origin top-left),
 * measured from the original workbook PDF, so the web page and the exported
 * PDF line up with the design exactly. */
(function () {
  'use strict';

  var PW = 390, PH = 780, NUM_PAGES = 4;
  var KEY = 'arpuplus-day2-workbook-v1';
  var INK = '#1b1f2a';
  var FF = '"DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", "Geeza Pro", Tahoma, sans-serif';

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
  function setStatus(msg) {
    if (msg) { statusEl.innerHTML = msg; return; }
    statusEl.innerHTML = storageOk
      ? '<b>✓ Saved on this phone</b>'
      : '<b>Can’t save on this phone.</b> Export before you close this page.';
  }

  /* ---------- helpers ---------- */
  function pct(v, total) { return (v / total * 100) + '%'; }
  function place(el, r) {
    el.style.left = pct(r.x, PW); el.style.top = pct(r.y, PH);
    el.style.width = pct(r.w, PW); el.style.height = pct(r.h, PH);
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
  for (var i = 1; i <= NUM_PAGES; i++) {
    var p = el('section', 'page', book);
    p.style.backgroundImage = 'url(pages/page-' + i + '.png)';
    p.setAttribute('aria-label', 'Page ' + i);
    pages.push(p);
  }

  NOTES.forEach(function (n) {
    var box = el('div', 'abs note', pages[n.page - 1]);
    place(box, n);
    box.style.background = n.bg;
    box.style.padding = 'calc(var(--u) * ' + n.padY + 'px) 0 0 calc(var(--u) * ' + n.padX + 'px)';
    var inner = el('div', '', box);
    inner.style.width = 'calc(var(--u) * ' + n.width + 'px)';
    n.blocks.forEach(function (b) {
      var d = el('div', '', inner);
      d.textContent = b.text;
      d.style.font = b.weight + ' calc(var(--u) * ' + b.size + 'px) / calc(var(--u) * ' + b.lh + 'px) ' + FF;
      d.style.color = b.color;
    });
  });

  var inputs = [];
  FIELDS.forEach(function (f) {
    var inp = el(f.multi ? 'textarea' : 'input', 'f', pages[f.page - 1]);
    if (!f.multi) { inp.type = 'text'; inp.setAttribute('enterkeyhint', 'next'); }
    inp.name = f.name;
    inp.dir = 'auto';
    inp.autocomplete = f.name === 'name' ? 'name' : 'off';
    inp.setAttribute('aria-label', f.label);
    inp.spellcheck = true;
    place(inp, f);
    inp.value = state.fields[f.name] || '';
    inp.addEventListener('input', function () { state.fields[f.name] = inp.value; save(); });
    inputs.push(inp);
  });
  inputs.forEach(function (inp, idx) {
    if (inp.tagName !== 'INPUT') return;
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var nx = inputs[idx + 1]; if (nx) nx.focus(); else inp.blur(); }
    });
  });

  /* ---------- sketch (page 4) ---------- */
  var sk = el('canvas', 'abs', pages[SK.page - 1]);
  sk.id = 'sketch';
  sk.setAttribute('aria-label', 'Sketch space. Tap Draw first, then draw with your finger.');
  place(sk, SK);
  var skCtx = sk.getContext('2d');

  var tools = el('div', 'abs tools', pages[TOOLS.page - 1]);
  place(tools, TOOLS);
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
  wipeBtn.addEventListener('click', function () {
    if (!state.strokes.length) return;
    if (confirm('Clear your drawing?')) { state.strokes = []; redrawSketch(); save(); }
  });

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

  /* ---------- scaling ---------- */
  function layout() {
    var w = pages[0].clientWidth || 390;
    document.documentElement.style.setProperty('--u', String(w / PW));
    redrawSketch();
  }
  if (window.ResizeObserver) new ResizeObserver(layout).observe(book);
  window.addEventListener('resize', layout);
  layout();

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
  $('clearAll').addEventListener('click', function () {
    if (!confirm('Clear all your answers and your drawing on this phone?')) return;
    state = { fields: {}, strokes: [] };
    inputs.forEach(function (inp) { inp.value = ''; });
    redrawSketch();
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
        s.onerror = function () { pdfLibPromise = null; reject(new Error('Could not load the PDF tool. Check your internet and try again.')); };
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
  var S = 4; // export resolution: canvas px per PDF point
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
    var ctx = c.getContext('2d');
    ctx.scale(S, S);
    ctx.textBaseline = 'alphabetic';
    return c;
  }

  function answerCanvas(text, f) {
    var c = makeCanvas(f.w, f.h), ctx = c.getContext('2d');
    var padX = 7, padY = f.multi ? 5 : 0, maxW = f.w - 2 * padX;
    var rtl = isRtl(text);
    ctx.fillStyle = INK;
    ctx.direction = rtl ? 'rtl' : 'ltr';
    ctx.textAlign = rtl ? 'right' : 'left';
    var tx = rtl ? f.w - padX : padX;
    var size = 12;
    if (!f.multi) {
      var one = text.replace(/\s+/g, ' ').trim();
      for (; size > 6; size -= 0.5) { ctx.font = fontStr(size); if (ctx.measureText(one).width <= maxW) break; }
      ctx.font = fontStr(size);
      ctx.fillText(one, tx, baseline(ctx, size, 0, f.h));
      return c;
    }
    var lines;
    for (;; size -= 0.5) {
      ctx.font = fontStr(size);
      lines = wrap(ctx, text, maxW);
      if (lines.length * size * 1.3 <= f.h - 2 * padY || size <= 6) break;
    }
    var lh = size * 1.3;
    lines.forEach(function (ln, k) { ctx.fillText(ln, tx, baseline(ctx, size, padY + k * lh, lh)); });
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
    var PDFLib;
    return Promise.all([loadPdfLib(), fontsReady()]).then(function (r) {
      PDFLib = r[0];
      return fetch('workbook.pdf', { cache: 'no-cache' });
    }).then(function (res) {
      if (!res.ok) throw new Error('Could not load the workbook file (' + res.status + ').');
      return res.arrayBuffer();
    }).then(function (bytes) {
      return PDFLib.PDFDocument.load(bytes);
    }).then(function (doc) {
      // drop the empty form boxes: the answers are drawn onto the page instead
      try { var form = doc.getForm(); form.getFields().forEach(function (fl) { form.removeField(fl); }); }
      catch (e) { try { doc.getForm().flatten(); } catch (_) {} }
      var pdfPages = doc.getPages();
      var jobs = [];
      function put(pageNo, r, canvas) {
        jobs.push(doc.embedPng(canvas.toDataURL('image/png')).then(function (img) {
          pdfPages[pageNo - 1].drawImage(img, { x: r.x, y: PH - r.y - r.h, width: r.w, height: r.h });
        }));
      }
      NOTES.forEach(function (n) { put(n.page, n, noteCanvas(n)); });
      FIELDS.forEach(function (f) {
        var v = state.fields[f.name] || '';
        if (v.trim()) put(f.page, f, answerCanvas(v, f));
      });
      if (state.strokes.length) {
        var c = makeCanvas(SK.w, SK.h);
        drawStrokes(c.getContext('2d'), state.strokes, S);
        put(SK.page, SK, c);
      }
      return Promise.all(jobs).then(function () {
        var who = (state.fields.name || '').trim();
        doc.setTitle('ArpuPlus Leadership Program · Day 2 Workbook' + (who ? ' · ' + who : ''));
        doc.setModificationDate(new Date());
        return doc.save();
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
  if (!canShareFiles) {
    shareBtn.style.display = 'none';
    $('sheetText').textContent = 'It should be downloading now. If nothing downloaded, open this link in Chrome or Safari and try again.';
  }

  exportBtn.addEventListener('click', function () {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Preparing…';
    buildPdf().then(function (bytes) {
      lastBlob = new Blob([bytes], { type: 'application/pdf' });
      lastName = fileName();
      download();
      sheetBg.classList.add('open');
    }).catch(function (err) {
      alert('Sorry, the PDF could not be made. ' + (err && err.message ? err.message : ''));
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
      if (e && e.name !== 'AbortError') alert('Sharing isn’t available here. Use Download again instead.');
    });
  });

  setStatus();
})();
