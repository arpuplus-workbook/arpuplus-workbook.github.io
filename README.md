# ArpuPlus · Day 2 Workbook

Live: https://arpuplus-workbook.github.io/

The Day 2 participant workbook as a web page that works the same on Android and iPhone:

- The page is the workbook HTML exactly as designed (pixel-identical on a phone).
- Answers save on the student's phone as they type. Boxes grow with the answer; one-line boxes wrap instead of scrolling. Arabic is right-aligned.
- **Save my workbook as PDF** builds the PDF right on the phone and downloads it (with a Share button where the phone supports it). No print dialog, so it also works inside WhatsApp and Instagram.
- In the PDF every answer sits in its box. A long answer makes its box (and the card around it) taller, so nothing is cut off. Ticks, the sketch, links and the "Workbook of ..." footer are included.

## Files

| File | What it is |
| --- | --- |
| `source/workbook-v1.html` | The workbook HTML as delivered. Edit the design here, never in `index.html` |
| `index.html` | Built from the source by `tools/build.py` |
| `app.js` | Autosave, growing boxes, sketch, and the PDF export |
| `template.pdf` | The workbook printed once, one vector page per section, built by `tools/template.js` |
| `template.json` | Where every box, tick box, the sketch and each link sits on `template.pdf` |
| `og.png` | The link preview image (WhatsApp, etc.) |
| `vendor/pdf-lib.min.js` | pdf-lib 1.17.1, builds the PDF in the browser |

## Publishing a new version of the workbook

1. Put the new HTML in `source/` (for example `source/workbook-v2.html`).
2. Build the page: `python3 tools/build.py source/workbook-v2.html index.html`
3. Build the PDF template (needs Google Chrome): `cd tools && npm install && node template.js`
4. Commit and push. GitHub Pages updates in about a minute.

The build only needs the HTML to keep the same conventions: every answer box has a `data-k` key,
the sketch is `<canvas id="sk">`, its clear button is `#skc`, and the save button is `#save`.
Answers saved by students carry over between versions for any box whose `data-k` stays the same.
