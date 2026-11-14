"""Turn the workbook HTML exactly as designed into the site's index.html.

    python3 tools/build.py source/workbook.html index.html

Only behaviour changes, never the look:
  * one-line boxes (<input type=text>) become one-row textareas styled the same,
    so a long answer wraps onto a new line and the box grows instead of scrolling;
  * every answer box gets dir="auto" so Arabic is right-aligned;
  * the inline script is replaced by app.js (same autosave and sketch, plus
    a direct PDF export instead of the browser print dialog);
  * link-preview tags and the styles for the "PDF ready" panel are added.
"""
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
html = open(src, encoding="utf-8").read()

# 1. one-line boxes -> one-row textareas (same CSS rule covers both)
def to_textarea(m):
    attrs = re.sub(r'\s*type="text"', "", m.group(1))
    return '<textarea class="one" rows="1"%s></textarea>' % attrs
html, n_inputs = re.subn(r'<input type="text"([^>]*)>', to_textarea, html)

# 2. Arabic-friendly answer boxes
html, n_dir = re.subn(r'<textarea(?![^>]*\bdir=)', '<textarea dir="auto"', html)

# 3. replace the inline script with app.js (keep everything else as is)
scripts = list(re.finditer(r"<script>.*?</script>", html, flags=re.S))
assert len(scripts) == 1, "expected exactly one inline script, found %d" % len(scripts)
s = scripts[0]

SHEET = """<div class="sheet-bg" id="sheetBg" role="dialog" aria-modal="true" aria-labelledby="sheetTitle"><div class="sheet">
<h3 id="sheetTitle">Your PDF is ready</h3><p id="sheetText"></p>
<div class="row"><button class="btn dark" id="share" type="button">Share PDF</button><button class="btn" id="again" type="button">Download again</button><button class="btn" id="printInstead" type="button">Print instead</button><button class="btn ghost" id="close" type="button">Close</button></div>
</div></div>"""
html = html[:s.start()] + SHEET + '<script src="app.js"></script>' + html[s.end():]

# 4. head additions
HEAD = """<meta name="description" content="Make time to lead. Fill in your Day 2 workbook on your phone and save it as a PDF.">
<meta property="og:type" content="website">
<meta property="og:title" content="ArpuPlus Leadership Program · Day 2 Workbook">
<meta property="og:description" content="Make time to lead. Fill in your workbook on your phone and save it as a PDF.">
<meta property="og:image" content="https://arpuplus-workbook.github.io/og.png">
<meta name="twitter:card" content="summary_large_image">
<style>
textarea.one{min-height:44px}
.btn.armed{background:var(--rust);color:var(--cream)}
.btn:disabled{opacity:.6}
.sheet-bg{position:fixed;inset:0;z-index:50;background:rgba(27,31,42,.55);display:none;align-items:flex-end;justify-content:center}
.sheet-bg.open{display:flex}
.sheet{width:100%;max-width:520px;background:var(--cream);color:var(--body);border-radius:20px 20px 0 0;padding:22px 22px calc(22px + env(safe-area-inset-bottom))}
.sheet h3{font-family:Bric,LF,sans-serif;font-weight:700;font-size:22px;line-height:1.1;text-transform:uppercase;color:var(--navy);margin-bottom:8px}
.sheet p{font-size:15px;color:var(--mute);margin-bottom:16px}
.sheet .row{display:flex;gap:10px;flex-wrap:wrap}
.sheet .btn{flex:1;text-align:center}
.sheet .btn.dark{background:var(--navy)}
.sheet .btn.ghost{flex:0 0 auto;margin-top:0;padding:12px 16px}
@media print{.sheet-bg{display:none!important}}
</style>
"""
assert html.count("</head>") == 1
html = html.replace("</head>", HEAD + "</head>")

open(dst, "w", encoding="utf-8").write(html)
print(f"{dst}: {n_inputs} one-line boxes converted, dir=auto on {n_dir} boxes, script swapped")
