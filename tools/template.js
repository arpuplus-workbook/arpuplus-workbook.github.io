/* Print the site's workbook once into template.pdf (vector, one page per
 * section, exactly as it looks on screen) and record where every answer box,
 * tick box, the sketch area and the links sit, in template.json.
 * Also saves og.png (the link preview image).
 *
 *   cd tools && npm install && node template.js /path/to/Google\ Chrome
 *
 * Positions are CSS px from each section's top-left, at the design's full
 * width of 520px (= 390pt). app.js uses them to write answers into the PDF. */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const site = path.resolve(__dirname, '..');
const chrome = process.argv[2] || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PW = 520;

(async () => {
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: PW, height: 1000, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(site, 'index.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  // link preview: top of the cover (down to "Participant workbook"), 1200 x 627
  await page.setViewport({ width: PW, height: 1000, deviceScaleFactor: 1200 / 494 });
  await page.screenshot({ path: path.join(site, 'og.png'), clip: { x: 0, y: 0, width: 494, height: 258 } });
  await page.setViewport({ width: PW, height: 1000, deviceScaleFactor: 1 });

  const map = await page.evaluate((PW) => {
    const st = document.createElement('style');
    st.textContent = `.fab,#skc,#save,.owner,.sheet-bg{display:none!important}
      html,body{background:var(--cream)}main{max-width:${PW}px;width:${PW}px;margin:0}
      .pg{border-bottom:0!important}`;
    document.head.appendChild(st);
    document.querySelectorAll('textarea').forEach(t => { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; });

    const secs = [...document.querySelectorAll('main > section')];
    const css = ['@page{margin:0}', 'section.pg{break-inside:avoid}'];
    const pages = secs.map((s, i) => {
      const h = Math.ceil(s.getBoundingClientRect().height);
      s.style.height = h + 'px';
      s.setAttribute('data-pg', i);
      css.push(`section[data-pg="${i}"]{page:p${i}${i < secs.length - 1 ? ';break-after:page' : ''}}`);
      css.push(`@page p${i}{size:${PW * 0.75}pt ${h * 0.75}pt}`);
      return { h, id: s.id || null };
    });
    const pst = document.createElement('style');
    pst.textContent = css.join('\n');
    document.head.appendChild(pst);

    const secOf = el => secs.findIndex(s => s.contains(el));
    const rel = (el, p) => {
      const r = el.getBoundingClientRect(), sr = secs[p].getBoundingClientRect();
      return { x: +(r.left - sr.left).toFixed(2), y: +(r.top - sr.top).toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
    };
    const fields = [...document.querySelectorAll('textarea[data-k]')].map(t => {
      const p = secOf(t), cs = getComputedStyle(t);
      return Object.assign({ k: t.dataset.k, p, one: t.classList.contains('one'),
        pt: parseFloat(cs.paddingTop), pl: parseFloat(cs.paddingLeft), bw: parseFloat(cs.borderTopWidth),
        lh: parseFloat(cs.lineHeight), fs: parseFloat(cs.fontSize) }, rel(t, p));
    });
    const checks = [...document.querySelectorAll('input[type=checkbox][data-k]')].map(c => {
      const p = secOf(c); return Object.assign({ k: c.dataset.k, p }, rel(c, p));
    });
    let sketch = null;
    const sk = document.getElementById('sk');
    if (sk) {
      const p = secOf(sk), r = rel(sk, p);
      sketch = { p, x: r.x + sk.clientLeft, y: r.y + sk.clientTop, w: sk.clientWidth, h: sk.clientHeight };
    }
    const links = [...document.querySelectorAll('main a[href]')].filter(a => a.getBoundingClientRect().width > 0).map(a => {
      const p = secOf(a), href = a.getAttribute('href');
      const o = Object.assign({ p }, rel(a, p));
      if (/^https?:/.test(href)) o.url = href;
      else if (href[0] === '#') { const t = document.getElementById(href.slice(1)); o.to = t ? secOf(t) : -1; }
      return o;
    });
    return { pw: PW, pages, fields, checks, sketch, links };
  }, PW);

  await page.emulateMediaType('screen');
  const pdfPath = path.join(site, 'template.pdf');
  await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });

  // Chrome rounds page heights to its own grid (off by up to ~0.5pt), so
  // record each page's real height; app.js anchors content to the page top.
  const { PDFDocument } = require(path.join(site, 'vendor', 'pdf-lib.min.js'));
  const printed = await PDFDocument.load(fs.readFileSync(pdfPath));
  const sizes = printed.getPages().map(p => p.getHeight());
  if (sizes.length !== map.pages.length) throw new Error(`expected ${map.pages.length} pages, got ${sizes.length}`);
  sizes.forEach((h, i) => { map.pages[i].ph = +h.toFixed(3); });
  fs.writeFileSync(path.join(site, 'template.json'), JSON.stringify(map));
  await browser.close();
  console.log(`template.pdf: ${map.pages.length} pages; ${map.fields.length} boxes, ${map.checks.length} tick boxes, ` +
    `${map.sketch ? 1 : 0} sketch, ${map.links.length} links`);
})().catch(e => { console.error(e); process.exit(1); });
