"""Render the field kit to print-ready A4 PDFs:  .venv/bin/python fieldkit/build_fieldkit.py [--png]
Sources: fieldkit/src/*.html (content from deck Annexure A2). Needs internet once for Google Fonts."""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = {'concept_board': 1, 'interview_script': 4, 'daily_tracker': 1}  # expected page counts

failed = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 794, 'height': 1123})
    for name, pages in DOCS.items():
        pg.goto('file://' + os.path.join(HERE, 'src', f'{name}.html'))
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(500)
        n = pg.evaluate("document.querySelectorAll('.page').length")
        # every page must fit: content overflowing a fixed A4 box would be clipped in print
        # nothing (footer included) may pass the page's bottom padding, or print would clip it
        over = pg.evaluate("""[...document.querySelectorAll('.page')].map((p,i)=>{
            const r=p.getBoundingClientRect(); const limit=r.bottom - parseFloat(getComputedStyle(p).paddingBottom) + 1;
            const last=Math.max(...[...p.querySelectorAll('*')].map(c=>c.getBoundingClientRect().bottom));
            const clipped=[...p.querySelectorAll('*')].filter(e=>getComputedStyle(e).overflow==='hidden' && e.scrollHeight>e.clientHeight+2).length;
            return last > limit ? 'page '+(i+1)+' overflows by '+Math.round(last-limit)+'px' : clipped ? 'page '+(i+1)+': '+clipped+' clipped box(es)' : null}).filter(Boolean)""")
        pg.pdf(path=os.path.join(HERE, f'{name}.pdf'), format='A4', print_background=True, prefer_css_page_size=True,
               margin=dict(top='0', bottom='0', left='0', right='0'))
        print(f'{name}.pdf  pages={n} (expected {pages})  {"OVERFLOW " + str(over) if over else "fits"}')
        if over or n != pages:
            failed.append(name)
        if '--png' in sys.argv:
            for i, el in enumerate(pg.query_selector_all('.page')):
                el.screenshot(path=os.path.join(HERE, f'preview_{name}_{i+1}.png'))
    b.close()
if failed:
    sys.exit(f'Layout check failed: {failed}')
