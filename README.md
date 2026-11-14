# ArpuPlus · Day 2 Workbook (web version)

Live: https://arpuplus-workbook.github.io/

A web version of the Day 2 participant workbook that works the same on Android and iPhone:

- Tap any white box to type (Arabic works too). Answers autosave on the student's phone.
- Page 4 has a finger-drawing space (tap **Draw**).
- **Export PDF** downloads the original workbook design with the student's answers drawn in, ready to send back.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page layout and styles |
| `app.js` | Box positions (in PDF points), autosave, drawing, PDF export |
| `pages/page-1.png` … `page-4.png` | The workbook pages, rendered from the PDF at 3x |
| `workbook.pdf` | The clean workbook the export writes answers onto |
| `vendor/pdf-lib.min.js` | pdf-lib 1.17.1, builds the PDF in the browser |

## Updating the design

Export the new PDF, re-render the pages to `pages/` (1170 x 2340 px each), replace `workbook.pdf`,
and update the box positions in `FIELDS` at the top of `app.js` if any box moved.
