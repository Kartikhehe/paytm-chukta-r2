"""Render deck: python3 build.py  ->  out/KartikRaj_R2.pdf (+ PNG previews with --png)."""
import json, sys, os
from jinja2 import Environment, FileSystemLoader
from markupsafe import Markup
import model

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

M = model.run()
S = model.sens()
V = json.load(open(os.path.join(HERE, 'validation.json')))


def inr(x, d=0):
    neg = x < 0
    x = abs(x)
    s = f"{x:.{d}f}"
    if '.' in s:
        i, f = s.split('.')
    else:
        i, f = s, ''
    if len(i) > 3:
        head, tail = i[:-3], i[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:]); head = head[:-2]
        if head: parts.insert(0, head)
        i = ','.join(parts + [tail])
    return ('-' if neg else '') + i + ('.' + f if f else '')


def cr(x, d=0):
    return f"₹{inr(x, d)} Cr"


def lk(x, d=1):
    return f"{x/1e5:.{d}f} L"


def tbd(w=''):
    return Markup(f'<span class="tbd" style="min-width:{w or 22}px">&nbsp;</span>')


def v(key, suffix=''):
    val = V.get(key)
    if val is None or val == '':
        return tbd()
    return Markup(f"{val}{suffix}")


def pct(num, den):
    n, d = V.get(num), V.get(den)
    if n is None or d in (None, 0):
        return tbd()
    return Markup(f"{round(100*n/d)}%")


def ratio(nums, den):
    d = V.get(den)
    ns = [V.get(n) for n in nums]
    if d in (None, 0) or any(n is None for n in ns):
        return None
    return sum(ns) / d


def verdict(val, bar):
    """val: fraction or count; returns result cell with PASS/BELOW chip."""
    if val is None:
        return tbd()
    shown = f"{round(val*100)}%" if bar < 1 else f"{int(val)}"
    chip = '<span class="chip g">PASS</span>' if val >= bar else '<span class="chip r">BELOW BAR</span>'
    return Markup(f"{shown} {chip}")


# ---------------- SVG charts ----------------
NAVY, CYAN, MIST, INK, GREY = '#002E6E', '#00BAF2', '#F3F7FB', '#14213D', '#5B6B82'


def chart_share():
    """Stacked bars: Paytm share of segment supplier UPI (today + Y1..Y3)."""
    W, H, pad, base = 330, 190, 30, 160
    vals = [M['years'][i]['seg_share'] * 100 for i in range(3)]
    data = [(8.0, 0)] + [(8.0, x - 8.0) for x in vals]
    labels = ['Today', 'Year 1', 'Year 2', 'Year 3']
    scale = 125 / 32
    bw = 46
    s = [f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    s.append(f'<line x1="20" y1="{base}" x2="{W-5}" y2="{base}" stroke="#9FB3C8"/>')
    for i, (b, u) in enumerate(data):
        x = 32 + i * 76
        hb, hu = b * scale, u * scale
        s.append(f'<rect x="{x}" y="{base-hb}" width="{bw}" height="{hb}" fill="#B8C7DA"/>')
        if u:
            s.append(f'<rect x="{x}" y="{base-hb-hu}" width="{bw}" height="{hu}" fill="{CYAN}"/>')
        tot = b + u
        s.append(f'<text x="{x+bw/2}" y="{base-hb-hu-6}" text-anchor="middle" font-size="15" font-weight="700" fill="{NAVY}">{tot:.1f}%</text>')
        s.append(f'<text x="{x+bw/2}" y="{base+16}" text-anchor="middle" font-size="12" fill="{INK}">{labels[i]}</text>')
    s.append('</svg>')
    return Markup(''.join(s))


def chart_gmv():
    W, H, base = 300, 170, 140
    ys = [M['years'][i]['gmv_y'] for i in range(3)]
    mx = max(ys)
    s = [f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    s.append(f'<line x1="10" y1="{base}" x2="{W-10}" y2="{base}" stroke="#9FB3C8"/>')
    for i, y in enumerate(ys):
        h = 105 * y / mx
        x = 30 + i * 90
        s.append(f'<rect x="{x}" y="{base-h}" width="58" height="{h}" rx="2" fill="{NAVY if i==2 else "#3A6BB0" if i==1 else "#7FA3D1"}"/>')
        s.append(f'<text x="{x+29}" y="{base-h-6}" text-anchor="middle" font-size="13.5" font-weight="700" fill="{NAVY}">{cr(y)}</text>')
        s.append(f'<text x="{x+29}" y="{base+15}" text-anchor="middle" font-size="12" fill="{INK}">Year {i+1}</text>')
    s.append('</svg>')
    return Markup(''.join(s))


def chart_tornado():
    rows = S['rows']
    W, H = 560, 222
    cx = 330
    gm = S['base_g']
    s = [f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    s.append(f'<text x="{cx}" y="12" text-anchor="middle" font-size="11.5" fill="{GREY}">Base: {cr(gm)} GMV / yr  ·  {cr(S["base_r"])} revenue / yr (Year 3)</text>')
    s.append(f'<line x1="{cx}" y1="20" x2="{cx}" y2="{H-6}" stroke="{INK}" stroke-dasharray="3 3"/>')
    y = 26
    for r in rows:
        gmv_row = abs(r['g_hi'] - r['g_lo']) > 1
        lo, hi, base, unit = (r['g_lo'], r['g_hi'], gm, 'GMV') if gmv_row else (r['r_lo'], r['r_hi'], S['base_r'], 'Rev')
        k = 200 / (base * 0.75)
        wl = (base - lo) * k
        wh = (hi - base) * k
        col = NAVY if gmv_row else '#7A8CA6'
        s.append(f'<text x="0" y="{y+17}" font-size="12" fill="{INK}">{r["label"]}</text>')
        s.append(f'<text x="0" y="{y+30}" font-size="10.5" fill="{GREY}">{unit} · range {r["lo"]} – {r["hi"]}</text>')
        s.append(f'<rect x="{cx-wl}" y="{y+6}" width="{wl}" height="24" fill="#9FB3C8"/>')
        s.append(f'<rect x="{cx}" y="{y+6}" width="{wh}" height="24" fill="{col if gmv_row else CYAN}"/>')
        s.append(f'<text x="{cx-wl-4}" y="{y+22}" text-anchor="end" font-size="11.5" font-weight="700" fill="{INK}">{cr(lo)}</text>')
        s.append(f'<text x="{cx+wh+4}" y="{y+22}" font-size="11.5" font-weight="700" fill="{INK}">{cr(hi)}</text>')
        y += 39
    s.append('</svg>')
    return Markup(''.join(s))


def chart_cac():
    parts = [('Distributor onboarding', 71), ('Salesman activation fee', 71), ('Counter training on service visit', 43),
             ('Soundbox / in-app comms', 5), ('Ops + fraud buffer', 30)]
    W, H = 330, 150
    s = [f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    acc = 0
    y = 4
    sc = 0.68
    for lab, val in parts:
        s.append(f'<text x="0" y="{y+15}" font-size="11.5" fill="{INK}">{lab}</text>')
        s.append(f'<rect x="{150+acc*sc}" y="{y+3}" width="{val*sc}" height="17" fill="{CYAN}"/>')
        s.append(f'<text x="{150+acc*sc+val*sc+3}" y="{y+16}" font-size="11.5" font-weight="700" fill="{NAVY}">₹{val}</text>')
        acc += val; y += 23
    s.append(f'<rect x="150" y="{y+3}" width="{acc*sc}" height="18" fill="{NAVY}"/>')
    s.append(f'<text x="0" y="{y+16}" font-size="12" font-weight="700" fill="{NAVY}">CAC per new active shop</text>')
    s.append(f'<text x="{150+acc*sc-6}" y="{y+16}" text-anchor="end" font-size="12" font-weight="700" fill="#fff">₹{acc}</text>')
    s.append('</svg>')
    return Markup(''.join(s))


def chart_revmix():
    """Stacked bars of revenue by line, Y1-Y3."""
    W, H, base = 240, 128, 104
    ys = M['years']; mx = max(y['rev'] for y in ys)
    cols = [('mdr', NAVY, 'Payer MDR'), ('acq', '#3A6BB0', 'Acquirer'), ('cred', CYAN, 'Credit')]
    s = [f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    s.append(f'<line x1="4" y1="{base}" x2="{W-70}" y2="{base}" stroke="#9FB3C8"/>')
    for i, y in enumerate(ys):
        x = 10 + i * 54; top = base
        for k, c, _ in cols:
            h = 82 * y[k] / mx
            s.append(f'<rect x="{x}" y="{top-h}" width="36" height="{h}" fill="{c}"/>'); top -= h
        s.append(f'<text x="{x+18}" y="{top-4}" text-anchor="middle" font-size="11" font-weight="700" fill="{NAVY}">{y["rev"]:.0f}</text>')
        s.append(f'<text x="{x+18}" y="{base+13}" text-anchor="middle" font-size="10.5" fill="{INK}">Y{i+1}</text>')
    for j, (_, c, lab) in enumerate(cols[::-1]):
        s.append(f'<rect x="{W-66}" y="{30+j*18}" width="10" height="10" fill="{c}"/><text x="{W-52}" y="{39+j*18}" font-size="10.5" fill="{INK}">{lab}</text>')
    s.append('</svg>')
    return Markup(''.join(s))


def chart_payback():
    """Cumulative revenue per shop vs CAC over 12 months."""
    W, H = 270, 175
    u = M['unit']; cac = model.A['cac']
    pay_m, all_m = u['r_pay'] / 12, u['r_all'] / 12
    x0, y0, xw, yh = 30, 148, 225, 130
    ymax = 12 * all_m
    def px(m): return x0 + xw * m / 12
    def py(v): return y0 - yh * v / ymax
    s = [f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    s.append(f'<line x1="{x0}" y1="{y0}" x2="{x0+xw}" y2="{y0}" stroke="#9FB3C8"/><line x1="{x0}" y1="{y0}" x2="{x0}" y2="{y0-yh}" stroke="#9FB3C8"/>')
    s.append(f'<line x1="{x0}" y1="{py(cac)}" x2="{x0+xw}" y2="{py(cac)}" stroke="#E5484D" stroke-dasharray="4 3"/>')
    s.append(f'<text x="{x0+4}" y="{py(cac)-4}" font-size="10.5" fill="#B4232A">CAC ₹{cac}</text>')
    s.append(f'<polyline fill="none" stroke="{CYAN}" stroke-width="3" points="{px(0)},{py(0)} {px(12)},{py(12*all_m)}"/>')
    s.append(f'<polyline fill="none" stroke="{NAVY}" stroke-width="3" points="{px(0)},{py(0)} {px(12)},{py(12*pay_m)}"/>')
    s.append(f'<circle cx="{px(cac/all_m)}" cy="{py(cac)}" r="4" fill="{CYAN}"/><circle cx="{px(cac/pay_m)}" cy="{py(cac)}" r="4" fill="{NAVY}"/>')
    s.append(f'<text x="{px(5.2)}" y="{py(6*all_m)-4}" text-anchor="end" font-size="10.5" fill="#0089B8" font-weight="700">incl. credit ₹{12*all_m:.0f}/yr</text>')
    s.append(f'<text x="{px(12)-2}" y="{py(12*pay_m)-6}" text-anchor="end" font-size="10.5" fill="{NAVY}" font-weight="700">payments ₹{12*pay_m:.0f}/yr</text>')
    for m in (0, 3, 6, 9, 12):
        s.append(f'<text x="{px(m)}" y="{y0+13}" text-anchor="middle" font-size="10" fill="{GREY}">{m}</text>')
    s.append(f'<text x="{x0+xw/2}" y="{H-1}" text-anchor="middle" font-size="10" fill="{GREY}">months after activation (cumulative revenue per shop)</text>')
    s.append('</svg>')
    return Markup(''.join(s))


def scenarios():
    import copy
    out = []
    for name, ad, sh, sp, cu, el in [('🐻 Bear', 0.20, 0.55, 40000, 0.10, 0.30), ('📍 Base', 0.35, 0.70, 60000, 0.20, 0.50), ('🚀 Bull', 0.50, 0.85, 80000, 0.25, 0.60)]:
        a = copy.deepcopy(model.A); a['adopt'][2] = ad; a['share'][2] = sh; a['spend'] = sp; a['credit_users'][2] = cu; a['mdr_elig'] = el
        y = model.run(a)['years'][2]
        out.append(dict(name=name, ad=ad, sh=sh, sp=sp, cu=cu, el=el, gmv=y['gmv_y'], share=y['seg_share'], rev=y['rev'], profit=y['profit']))
    return out


def ladder():
    """Commitment ladder bars from validation.json."""
    n = V.get('walk_n')
    rows = [('L1', 'Would share a real supplier bill to be read', 'l1_bill'),
            ('L2', 'Would add suppliers + switch on the 9 pm reminder', 'l2_reminder'),
            ('L3', 'Would pay their next supplier bill via Paytm', 'l3_paid'),
            ('L4', 'Want to join the 90-day pilot', 'l4_pilot')]
    out = []
    for code, lab, key in rows:
        val = V.get(key)
        if val is None or not n:
            bar = '<div class="lbar empty"><span class="tbd" style="min-width:26px">&nbsp;</span> / <span class="tbd" style="min-width:26px">&nbsp;</span></div>'
        else:
            w = max(6, 100 * val / n)
            bar = f'<div class="lbar"><div style="width:{w}%"></div><b>{val}/{n} ({round(100*val/n)}%)</b></div>'
        out.append(f'<div class="lrow"><span class="lcode">{code}</span><span class="llab">{lab}</span>{bar}</div>')
    return Markup(''.join(out))


env = Environment(loader=FileSystemLoader(HERE), autoescape=False)
env.globals.update(M=M, S=S, V=V, A=model.A, cr=cr, lk=lk, inr=inr, v=v, pct=pct, tbd=tbd,
                   chart_share=chart_share, chart_gmv=chart_gmv, chart_tornado=chart_tornado,
                   chart_cac=chart_cac, ladder=ladder, round=round, ratio=ratio, verdict=verdict, chart_revmix=chart_revmix, chart_payback=chart_payback, SC=scenarios())
html = env.get_template('deck.html.j2').render()
open(os.path.join(OUT, 'deck.html'), 'w').write(html)

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.goto('file://' + os.path.join(OUT, 'deck.html'))
    pg.wait_for_timeout(400)
    pg.pdf(path=os.path.join(OUT, 'KartikRaj_R2.pdf'), width='1280px', height='720px', print_background=True,
           margin=dict(top='0', bottom='0', left='0', right='0'))
    if '--png' in sys.argv:
        n = pg.evaluate("document.querySelectorAll('.slide').length")
        over = pg.evaluate("""[...document.querySelectorAll('.slide')].map((s,i)=>{
            const bad=[...s.querySelectorAll('.chk')].filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).map(e=>e.className+':'+(e.textContent||'').slice(0,40));
            return bad.length? (i)+': '+bad.join(' | '):null}).filter(Boolean)""")
        print('OVERFLOW:', over)
        spill = pg.evaluate("""[...document.querySelectorAll('.slide')].map((s,i)=>{
            const body=s.querySelector('.body'); if(!body) return null; const bb=body.getBoundingClientRect().bottom+1;
            const bad=[...body.querySelectorAll('.panel,.stat,table')].filter(e=>e.getBoundingClientRect().bottom>bb).length;
            return bad? i+': '+bad+' elements past body':null}).filter(Boolean)""")
        print('SPILL:', spill)
        for i in range(n):
            el = pg.query_selector_all('.slide')[i]
            el.screenshot(path=os.path.join(OUT, f's{i:02d}.png'))
    b.close()
print('built')
