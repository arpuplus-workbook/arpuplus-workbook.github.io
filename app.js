/* ArpuPlus Day 2 workbook.
 *
 * On screen: the workbook HTML as designed. Answers save on the phone as you
 * type (same storage key and format as the original page), boxes grow with
 * their text, and the sketch saves too.
 *
 * Export: instead of the browser's print dialog (unreliable on phones and
 * missing in in-app browsers), the PDF is built right here from
 * template.pdf: the workbook printed once, one page per section, with every
 * box's position recorded in template.json. Each answer is written into its
 * box; when an answer is longer than its box, the page is cut through the
 * middle of that row of boxes and a thin slice is stretched, so the box, its
 * card and everything below move down and the whole answer shows. */
(function () {
  'use strict';

  var KEY = 'arpuplus-day2-workbook', data = {};
  function stored() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return null; } }
  data = stored() || {};
  // Save only the answer that changed, on top of what is stored, so two open
  // tabs of the workbook never overwrite each other's answers.
  function save(k) {
    try {
      var cur = stored() || {};
      if (data[k] === undefined) delete cur[k]; else cur[k] = data[k];
      localStorage.setItem(KEY, JSON.stringify(cur));
    } catch (e) {}
  }
  function grow(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- answers: restore, autosave, grow ---------- */
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-k]'));
  var boxes = els.filter(function (el) { return el.tagName === 'TEXTAREA'; });
  els.forEach(function (el) {
    var k = el.getAttribute('data-k');
    if (el.type === 'checkbox') {
      el.checked = !!data[k];
      el.addEventListener('change', function () { data[k] = el.checked; save(k); });
      return;
    }
    if (data[k]) el.value = data[k];
    if (el.tagName === 'TEXTAREA') grow(el);
    el.addEventListener('input', function () {
      // one-line boxes wrap and grow, but never hold line breaks
      if (el.classList.contains('one') && /[\r\n]/.test(el.value)) el.value = el.value.replace(/\s*[\r\n]+\s*/g, ' ');
      data[k] = el.value; save(k);
      if (el.tagName === 'TEXTAREA') grow(el);
      if (k === 'name') owner();
    });
  });
  // Enter in a one-line box moves to the next box, like a form
  boxes.forEach(function (t, i) {
    if (!t.classList.contains('one')) return;
    t.setAttribute('enterkeyhint', 'next');
    t.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var nx = boxes[i + 1]; if (nx) nx.focus(); else t.blur(); }
    });
  });
  function growAll() { boxes.forEach(grow); }
  window.addEventListener('load', growAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(growAll);
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; growAll(); } });

  function ownerText() {
    return data.name ? ('Workbook of ' + data.name + ' · ArpuPlus Leadership Program · Day 2') : 'ArpuPlus Leadership Program · Day 2';
  }
  function owner() { var o = $('owner'); if (o) o.textContent = ownerText(); }
  owner();

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

  /* ---------- sketch ---------- */
  var c = $('sk');
  if (c) {
    var x = c.getContext('2d'), down = false, last = null;
    x.lineWidth = 4; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#1B1F2A';
    if (data._sk) { var im = new Image(); im.onload = function () { x.drawImage(im, 0, 0); }; im.src = data._sk; }
    var pos = function (e) { var r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height }; };
    c.addEventListener('pointerdown', function (e) { down = true; last = pos(e); try { c.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
    c.addEventListener('pointermove', function (e) {
      if (!down) return;
      var p = pos(e); x.beginPath(); x.moveTo(last.x, last.y); x.lineTo(p.x, p.y); x.stroke(); last = p; e.preventDefault();
    });
    var up = function () { if (!down) return; down = false; try { data._sk = c.toDataURL('image/png'); save('_sk'); } catch (e) {} };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    var skc = $('skc');
    if (skc) tapTwice(skc, 'Tap again to clear', function () { x.clearRect(0, 0, c.width, c.height); delete data._sk; save('_sk'); });
  }

  /* ---------- printing still works (browser menu, or "Print instead") ---------- */
  function before() {
    document.querySelectorAll('textarea').forEach(function (t) {
      var d = t.nextElementSibling;
      if (!d || !d.classList || !d.classList.contains('pv')) { d = document.createElement('div'); d.className = 'pv'; t.parentNode.insertBefore(d, t.nextSibling); }
      d.textContent = t.value;
    });
  }
  window.addEventListener('beforeprint', before);

  /* ---------- PDF export ---------- */
  var S = 0.75;                 // PDF points per CSS px
  var NAVY = '#1B1F2A', MUTE = '#5F636C', TEAL = '#1D6B66';
  var FONT = 'LF, Arial, "Noto Sans Arabic", "Geeza Pro", Tahoma, sans-serif';

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
  setTimeout(function () { loadPdfLib().catch(function () {}); }, 5000);

  function get(url, kind) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Could not load ' + url + ' (' + r.status + ').');
      return kind === 'json' ? r.json() : r.arrayBuffer();
    });
  }
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return document.fonts.load('400 16px LF').catch(function () {});
  }
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
        line = '';
        Array.from(word).forEach(function (ch) {   // a word wider than the box
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
    var a = m.fontBoundingBoxAscent || size * 0.95, d = m.fontBoundingBoxDescent || size * 0.25;
    return lineTop + (lh - (a + d)) / 2 + a;
  }
  // canvas for a w x h CSS-px area: 3 canvas px per CSS px (4 per PDF point),
  // less for very tall areas so phones stay under their canvas size limit
  function makeCanvas(w, h) {
    var s = Math.max(1, Math.min(3, Math.sqrt(12e6 / (w * h))));
    var cv = document.createElement('canvas');
    cv.width = Math.ceil(w * s); cv.height = Math.ceil(h * s);
    var ctx = cv.getContext('2d');
    ctx.scale(s, s);
    ctx.textBaseline = 'alphabetic';
    return cv;
  }
  var measureCtx = document.createElement('canvas').getContext('2d');

  function answerText(f) {
    var v = data[f.k] || '';
    return f.one ? v.replace(/\s*[\r\n]+\s*/g, ' ') : v;
  }
  function answerLines(ctx, f) {
    ctx.font = '400 ' + f.fs + 'px ' + FONT;
    return wrap(ctx, answerText(f), f.w - 2 * (f.bw + f.pl));
  }
  function answerCanvas(f, H) {
    var text = answerText(f), cv = makeCanvas(f.w, H), ctx = cv.getContext('2d');
    var rtl = isRtl(text);
    ctx.fillStyle = NAVY;
    ctx.direction = rtl ? 'rtl' : 'ltr';
    ctx.textAlign = rtl ? 'right' : 'left';
    var lines = answerLines(ctx, f);
    var tx = rtl ? f.w - f.bw - f.pl : f.bw + f.pl;
    lines.forEach(function (ln, i) { ctx.fillText(ln, tx, baseline(ctx, f.fs, f.bw + f.pt + i * f.lh, f.lh)); });
    return cv;
  }
  function tickCanvas(w, h) {
    var cv = makeCanvas(w, h), ctx = cv.getContext('2d'), r = 3;
    ctx.fillStyle = TEAL;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r); ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r); ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, w * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(w * 0.24, h * 0.53); ctx.lineTo(w * 0.42, h * 0.71); ctx.lineTo(w * 0.77, h * 0.31); ctx.stroke();
    return cv;
  }
  function ownerCanvas(w) {
    var h = 13.5, cv = makeCanvas(w, h), ctx = cv.getContext('2d');
    ctx.font = '400 9px ' + FONT; ctx.fillStyle = MUTE; ctx.textAlign = 'center';
    ctx.fillText(ownerText(), w / 2, baseline(ctx, 9, 0, h));
    return cv;
  }

  function buildPdf() {
    var L, T;
    // export the latest saved answers (another open tab may have added some)
    var latest = stored();
    if (latest) Object.keys(latest).forEach(function (k) { if (!(k in data)) data[k] = latest[k]; });
    return Promise.all([loadPdfLib(), fontsReady(), get('template.json', 'json'), get('template.pdf')]).then(function (r) {
      L = r[0]; T = r[2];
      return Promise.all([L.PDFDocument.load(r[3]), L.PDFDocument.create()]);
    }).then(function (docs) {
      var src = docs[0], out = docs[1];
      return out.embedPages(src.getPages()).then(function (E) {
        var PW = T.pw, jobs = [], pages = [], pageInfo = [];
        var imgCache = {};
        function img(key, make) {
          if (!imgCache[key]) imgCache[key] = out.embedPng(make().toDataURL('image/png'));
          return imgCache[key];
        }
        T.pages.forEach(function (P, pi) {
          // rows of boxes on this page (boxes side by side grow together)
          var rows = [];
          T.fields.forEach(function (f) {
            if (f.p !== pi) return;
            var row = null;
            rows.forEach(function (r) { if (Math.abs(r.y - f.y) < 0.5) row = r; });
            if (!row) { row = { y: f.y, h: f.h, mid: f.y + f.h / 2, fields: [], extra: 0 }; rows.push(row); }
            row.fields.push(f); f.row = row;
          });
          rows.forEach(function (r) {
            var need = 0;
            r.fields.forEach(function (f) {
              if (!answerText(f).trim()) return;
              need = Math.max(need, answerLines(measureCtx, f).length * f.lh + 2 * (f.pt + f.bw));
            });
            r.extra = need - r.h > 0.5 ? Math.ceil(need - r.h) : 0;
          });
          var off = function (y) { var s = 0; rows.forEach(function (r) { if (r.mid < y) s += r.extra; }); return s; };
          // Template pages are a hair taller or shorter than their section
          // (Chrome rounds page sizes). Content is anchored to the page top,
          // so use the shorter of the two: only bottom padding is ever trimmed.
          var ph = P.ph || P.h * S;               // real template page height, pt
          var base = Math.min(P.h, ph / S);       // section height used here, px
          var H = base; rows.forEach(function (r) { H += r.extra; });
          var page = out.addPage([PW * S, H * S]);
          pages.push(page); pageInfo.push({ H: H, off: off });
          var Ep = E[pi];

          // the section's design, cut and stretched where rows grew
          var clipped = function (y0, hh, draw) {   // y0/hh in PDF points from the bottom
            page.pushOperators(L.pushGraphicsState(), L.rectangle(0, y0, PW * S, hh), L.clip(), L.endPath());
            draw();
            page.pushOperators(L.popGraphicsState());
          };
          var cuts = rows.filter(function (r) { return r.extra > 0; }).sort(function (a, b) { return a.mid - b.mid; });
          // template page drawn with its top at `o` px below our page top
          var at = function (o) { return (H - o) * S - ph; };
          if (!cuts.length) {
            page.drawPage(Ep, { x: 0, y: at(0) });
          } else {
            var a = 0, o = 0;
            var band = function (from, to, o, padTop, padBottom) {
              var top = (H - (from + o)) * S + padTop, bottom = (H - (to + o)) * S - padBottom;
              clipped(bottom, top - bottom, function () { page.drawPage(Ep, { x: 0, y: at(o) }); });
            };
            cuts.forEach(function (cut) {
              band(a, cut.mid, o, a ? 0.5 : 0, 0.5);
              // stretch the 2px slice [mid-1, mid+1] to the extra height
              var k = cut.extra / 2, tb = (H - (cut.mid + o + cut.extra)) * S;
              clipped(tb - 0.5, cut.extra * S + 1, function () {
                page.drawPage(Ep, { x: 0, y: tb - k * (ph - (cut.mid + 1) * S), xScale: 1, yScale: k });
              });
              o += cut.extra; a = cut.mid;
            });
            band(a, base, o, 0.5, 0);
          }

          var put = function (imgPromise, bx, by, bw, bh) {
            jobs.push(imgPromise.then(function (im) {
              page.drawImage(im, { x: bx * S, y: (H - by - bh) * S, width: bw * S, height: bh * S });
            }));
          };
          rows.forEach(function (r) {
            r.fields.forEach(function (f) {
              if (!answerText(f).trim()) return;
              var hh = f.h + r.extra;
              put(out.embedPng(answerCanvas(f, hh).toDataURL('image/png')), f.x, f.y + off(f.y), f.w, hh);
            });
          });
          T.checks.forEach(function (ck) {
            if (ck.p === pi && data[ck.k]) put(img('tick' + ck.w + 'x' + ck.h, function () { return tickCanvas(ck.w, ck.h); }), ck.x, ck.y + off(ck.y), ck.w, ck.h);
          });
          if (T.sketch && T.sketch.p === pi && data._sk) {
            put(out.embedPng(data._sk), T.sketch.x, T.sketch.y + off(T.sketch.y), T.sketch.w, T.sketch.h);
          }
          put(img('owner', function () { return ownerCanvas(PW); }), 0, H - 4 - 13.5, PW, 13.5);
        });

        // clickable links: the video, and the contents page jumping to each part
        T.links.forEach(function (ln) {
          var info = pageInfo[ln.p], yy = ln.y + info.off(ln.y);
          var rect = [ln.x * S, (info.H - yy - ln.h) * S, (ln.x + ln.w) * S, (info.H - yy) * S];
          var dict = { Type: 'Annot', Subtype: 'Link', Rect: rect, Border: [0, 0, 0] };
          if (ln.url) dict.A = { Type: 'Action', S: 'URI', URI: L.PDFString.of(ln.url) };
          else if (ln.to >= 0) dict.Dest = [pages[ln.to].ref, 'Fit'];
          else return;
          pages[ln.p].node.addAnnot(out.context.register(out.context.obj(dict)));
        });

        return Promise.all(jobs).then(function () {
          var who = (data.name || '').trim();
          out.setTitle('ArpuPlus Leadership Program · Day 2 Workbook' + (who ? ' · ' + who : ''));
          out.setAuthor('Red Rock International');
          out.setCreator('ArpuPlus Day 2 Workbook');
          out.setCreationDate(new Date());
          out.setModificationDate(new Date());
          return out.save();
        });
      });
    });
  }
  window.__buildWorkbookPdf = buildPdf; // used by automated checks

  function fileName() {
    var who = (data.name || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '').trim().slice(0, 40);
    return 'ArpuPlus Day 2 Workbook' + (who ? ' - ' + who : '') + '.pdf';
  }
  var lastBlob = null, lastName = '';
  function download() {
    var url = URL.createObjectURL(lastBlob), a = document.createElement('a');
    a.href = url; a.download = lastName; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  var saveBtn = $('save'), sheetBg = $('sheetBg'), shareBtn = $('share');
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
    $('printInstead').style.display = ok ? 'none' : '';
    sheetBg.classList.add('open');
  }
  if (saveBtn) {
    var idleLabel = saveBtn.textContent;
    saveBtn.addEventListener('click', function () {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Preparing your PDF…';
      buildPdf().then(function (bytes) {
        lastBlob = new Blob([bytes], { type: 'application/pdf' });
        lastName = fileName();
        download();
        openSheet('Your PDF is ready', READY_TEXT, true);
      }).catch(function (err) {
        openSheet('The PDF couldn’t be made',
          ((err && err.message) ? err.message + ' ' : '') + 'Check your internet connection and try again. Your answers are still saved.', false);
      }).then(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = idleLabel;
      });
    });
  }
  $('again').addEventListener('click', function () { if (lastBlob) download(); });
  $('printInstead').addEventListener('click', function () { sheetBg.classList.remove('open'); before(); window.print(); });
  $('sheetClose').addEventListener('click', function () { sheetBg.classList.remove('open'); });
  sheetBg.addEventListener('click', function (e) { if (e.target === sheetBg) sheetBg.classList.remove('open'); });
  shareBtn.addEventListener('click', function () {
    if (!lastBlob) return;
    var file = new File([lastBlob], lastName, { type: 'application/pdf' });
    navigator.share({ files: [file], title: lastName }).catch(function (e) {
      if (e && e.name !== 'AbortError') $('sheetText').textContent = 'Sharing isn’t available in this browser. Tap Download again instead.';
    });
  });
})();
