"""Paytm Chukta - Round 2 business model. Single source of truth for deck + annexure."""

A = dict(
    devices=1.57e7,          # Paytm device merchants, Q1 FY27
    stock_share=0.45,        # share that buy stock from suppliers
    upi_share=0.60,          # of those, pay suppliers over UPI monthly
    spend=60000,             # outgoing business UPI per merchant / month (Rs)
    base_share=0.08,         # Paytm share today (national app share proxy; Kanpur VOC = 0%)
    adopt=[0.08, 0.20, 0.35],
    share=[0.50, 0.60, 0.70],
    bills=10,                # supplier payments / merchant / month (all apps)
    mdr_elig=0.50,           # share of Chukta GMV that is P2M > Rs 2,000 (rest bank a/c, P2PM, small)
    tpap=0.0008,             # payer-app share of 0.4% MDR
    acq_share=0.30,          # share of supplier QRs acquired by Paytm (Chukta Collect)
    acq=0.0012,              # acquirer share of 0.4% MDR
    credit_users=[0.10, 0.15, 0.20],
    credit_amt=20000,        # Rs drawn / user / month
    credit_take=0.015,       # Paytm distribution take
    build=6.0,               # Rs Cr one-time (Y1)
    run=6.0,                 # Rs Cr / yr team + infra
    cac=220,                 # Rs per new active merchant
    capture=0.30,            # Rs per OCR-read bill
    ocr_share=0.50,          # share of bills needing OCR (rest QR / API / push)
    support=10,              # Rs / active / yr
    upi_national=29.9e5,     # Rs Cr / month, Aug 2026 (29.9 L Cr)
)
CR = 1e7


def run(a=A):
    target = a['devices'] * a['stock_share'] * a['upi_share']
    pool_m = target * a['spend'] / CR                  # Rs Cr / month
    out = dict(target=target, pool_m=pool_m, pool_y=pool_m * 12, years=[])
    prev = 0
    for i in range(3):
        ad = target * a['adopt'][i]
        up = a['share'][i] - a['base_share']
        g_m = ad * a['spend'] * up / CR
        g_y = g_m * 12
        tx = ad * a['bills'] * up
        mdr = g_y * a['mdr_elig'] * a['tpap']
        acq = g_y * a['mdr_elig'] * a['acq_share'] * a['acq']
        cu = ad * a['credit_users'][i]
        disb = cu * a['credit_amt'] * 12 / CR
        cred = disb * a['credit_take']
        rev = mdr + acq + cred
        new = ad - prev
        c_acq = new * a['cac'] / CR
        c_cap = ad * a['bills'] * 12 * a['ocr_share'] * a['capture'] / CR
        c_sup = ad * a['support'] / CR
        cost = (a['build'] if i == 0 else 0) + a['run'] + c_acq + c_cap + c_sup
        seg_share = a['base_share'] + g_m / pool_m
        out['years'].append(dict(
            adopters=ad, uplift=up, gmv_m=g_m, gmv_y=g_y, tx=tx, mdr=mdr, acq=acq,
            credit_users=cu, disb=disb, cred=cred, rev=rev, new=new, c_acq=c_acq,
            c_cap=c_cap, c_sup=c_sup, cost=cost, profit=rev - cost, seg_share=seg_share,
            nat_pp=g_m / a['upi_national'] * 100, cost_per_active=cost * CR / ad,
            paise_per_rupee=cost / g_y * 100, per_1000=cost / g_y * 1000))
        prev = ad
    y3 = out['years'][2]
    # per-merchant unit economics at Y3 share
    gm = a['spend'] * 12 * (a['share'][2] - a['base_share'])
    r_mdr = gm * a['mdr_elig'] * a['tpap']
    r_acq = gm * a['mdr_elig'] * a['acq_share'] * a['acq']
    r_cred = a['credit_users'][2] * a['credit_amt'] * 12 * a['credit_take']
    out['unit'] = dict(gmv=gm, r_mdr=r_mdr, r_acq=r_acq, r_cred=r_cred,
                       r_pay=r_mdr + r_acq, r_all=r_mdr + r_acq + r_cred,
                       payback_pay=a['cac'] / ((r_mdr + r_acq) / 12),
                       payback_all=a['cac'] / ((r_mdr + r_acq + r_cred) / 12),
                       ltv_pay=(r_mdr + r_acq) * (1 + .7 + .49),
                       ltv_all=(r_mdr + r_acq + r_cred) * (1 + .7 + .49),
                       cac_pct=a['cac'] / (a['spend'] * 12 * (a['share'][0] - a['base_share'])) * 100)
    out['cum_gmv'] = sum(y['gmv_y'] for y in out['years'])
    out['cum_cost'] = sum(y['cost'] for y in out['years'])
    out['cum_rev'] = sum(y['rev'] for y in out['years'])
    return out


def sens():
    """Tornado on Y3 incremental GMV (Rs Cr/yr) and Y3 revenue."""
    base = run()
    b = base['years'][2]
    rows = []
    def var(label, key, lo, hi, idx=None, lo_lbl='', hi_lbl=''):
        res = []
        for v in (lo, hi):
            a = dict(A); a = {k: (list(x) if isinstance(x, list) else x) for k, x in A.items()}
            if idx is None: a[key] = v
            else: a[key][idx] = v
            r = run(a)['years'][2]
            res.append((r['gmv_y'], r['rev']))
        rows.append(dict(label=label, lo=lo_lbl, hi=hi_lbl, g_lo=res[0][0], g_hi=res[1][0],
                         r_lo=res[0][1], r_hi=res[1][1]))
    var('Y3 adoption of target merchants', 'adopt', 0.20, 0.50, 2, '20%', '50%')
    var('Avg supplier UPI / merchant / month', 'spend', 40000, 80000, None, '₹40k', '₹80k')
    var('Paytm share of an adopter\'s supplier UPI', 'share', 0.55, 0.85, 2, '55%', '85%')
    var('MDR-eligible share of Chukta GMV', 'mdr_elig', 0.20, 0.70, None, '20%', '70%')
    var('Credit users among adopters (Y3)', 'credit_users', 0.10, 0.30, 2, '10%', '30%')
    return dict(base_g=b['gmv_y'], base_r=b['rev'], rows=rows)


if __name__ == '__main__':
    import json
    o = run()
    for i, y in enumerate(o['years'], 1):
        print(f"Y{i}: adopters {y['adopters']/1e5:.2f}L  GMV {y['gmv_y']:,.0f} Cr/yr ({y['gmv_m']:,.0f}/mo)  "
              f"tx {y['tx']/1e5:.1f}L/mo  rev {y['rev']:.1f} (mdr {y['mdr']:.1f} acq {y['acq']:.1f} cred {y['cred']:.1f})  "
              f"cost {y['cost']:.1f} (acq {y['c_acq']:.1f})  seg share {y['seg_share']*100:.1f}%  nat +{y['nat_pp']:.3f}pp  "
              f"cost/active {y['cost_per_active']:.0f}  per1000 {y['per_1000']:.2f}")
    print('target', o['target'], 'pool/mo', o['pool_m'])
    print('unit', {k: round(v, 1) for k, v in o['unit'].items()})
    print('cum', round(o['cum_gmv']), round(o['cum_rev'], 1), round(o['cum_cost'], 1))
    s = sens()
    print(round(s['base_g']), round(s['base_r'], 1))
    for r in s['rows']: print(r['label'], round(r['g_lo']), round(r['g_hi']), round(r['r_lo'], 1), round(r['r_hi'], 1))
