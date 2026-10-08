import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Avatar, DemoTag } from '../components/ui.jsx'
import { ABOUT } from '../components/about.js'
import { COLLECT_ROWS, COLLECT_STATUS, COLLECT_TILES } from '../data/demo.js'
import { download, toCsv } from '../lib/csv.js'
import { inr } from '../lib/fmt.js'

const dayStr = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }
const isoStr = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10) }
const ST_ICON = { paid: 'checkCircle', seen: 'info', sent: 'send', later: 'calendar', overdue: 'clock', dispute: 'flag' }
const RAIL = { qr: 'Paytm QR', bank: 'Bank a/c (UPI)' }
const REMINDABLE = ['sent', 'seen', 'overdue']

const VIEWS = [
  ['overview', 'grid', 'Overview'],
  ['invoices', 'receipt', 'Invoices'],
  ['retailers', 'store', 'Retailers'],
  ['settlements', 'bank', 'Settlements'],
  ['tally', 'download', 'Tally export'],
]
// KPI tiles that open a view (tile index → [view, status filter])
const TILE_LINK = [['invoices', 'all'], ['invoices', 'paid'], ['retailers', 'all'], null]
const TILE_ICON = ['send', 'checkCircle', 'store', 'zap']

const card = 'rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-line/70'

function Status({ s }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold ${COLLECT_STATUS[s].cls}`}>
      <Icon name={ST_ICON[s]} size={13} strokeWidth={2.2} />{COLLECT_STATUS[s].hi}
    </span>
  )
}

function RemindBtn({ r, flash }) {
  if (!REMINDABLE.includes(r.status)) return null
  return (
    <button onClick={() => flash(`Demo: ${r.retailer} ko Soundbox + push reminder (UPI collect request kabhi nahi)`)}
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-navy ring-1 ring-line hover:bg-sky">
      <Icon name="bell" size={14} />Remind
    </button>
  )
}

function Head({ title, sub, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-[22px] font-bold tracking-tight text-ink">{title} <DemoTag>demo data</DemoTag></h1>
        <p className="text-[13px] text-grey">{sub}</p>
      </div>
      {children}
    </div>
  )
}

function InvoiceTable({ filter, setFilter, flash }) {
  const [q, setQ] = useState('')
  const rows = useMemo(() => COLLECT_ROWS.filter((r) =>
    (filter === 'all' || r.status === filter) && (!q || (r.retailer + r.invoice + r.area).toLowerCase().includes(q.toLowerCase()))), [filter, q])
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const exportCsv = () => {
    const head = ['Retailer', 'Area', 'Invoice', 'Amount (INR)', 'Sent on', 'Status', 'Due', 'Data']
    const body = rows.map((r) => [r.retailer, r.area, r.invoice, r.amount, isoStr(r.sent), COLLECT_STATUS[r.status].hi, r.due != null ? isoStr(r.due) : '', 'DEMO'])
    download(`chukta_collect_invoices_demo_${isoStr(0)}.csv`, toCsv([head, ...body]))
    flash(`${rows.length} invoices exported (CSV, demo data)`)
  }
  return (
    <section className={`overflow-hidden ${card}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3 md:p-4">
        <h2 className="mr-2 text-[15px] font-semibold text-ink">Retailer × invoice × status</h2>
        <div className="ml-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="flex min-h-10 flex-1 items-center gap-2 rounded-xl px-3 ring-1 ring-line sm:w-56 sm:flex-none">
            <Icon name="search" size={16} className="text-grey" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search retailer / invoice" className="w-full bg-transparent text-[14px] outline-none" />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="min-h-10 rounded-xl bg-white px-2 text-[14px] ring-1 ring-line">
            <option value="all">All statuses</option>
            {Object.entries(COLLECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.hi}</option>)}
          </select>
          <button onClick={exportCsv} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-navy px-4 text-[14px] font-semibold text-white hover:bg-navy2">
            <Icon name="download" size={16} />Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[14px]">
          <thead>
            <tr className="bg-mist text-left text-[11.5px] font-semibold uppercase tracking-wide text-grey">
              <th className="px-4 py-2.5">Retailer</th><th className="px-3 py-2.5">Invoice</th>
              <th className="px-3 py-2.5 text-right">Amount</th><th className="px-3 py-2.5">Sent</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-grey">No invoices match</td></tr>}
            {rows.map((r) => (
              <tr key={r.invoice} className="border-t border-line/70 hover:bg-[#F8FBFE]">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5"><Avatar name={r.retailer} size={30} />
                    <div><div className="font-semibold text-ink">{r.retailer}</div><div className="text-[12px] text-grey">{r.area}</div></div></div>
                </td>
                <td className="px-3 py-2.5 text-ink2">#{r.invoice}</td>
                <td className="tnum px-3 py-2.5 text-right font-semibold">{inr(r.amount)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-grey">{dayStr(r.sent)}</td>
                <td className="px-3 py-2.5">
                  <Status s={r.status} />
                  {r.status === 'paid' && r.rail && <div className="mt-0.5 text-[11.5px] text-grey">{RAIL[r.rail]} · {dayStr(r.paid)}</div>}
                  {r.due != null && r.status !== 'paid' && <div className="mt-0.5 text-[11.5px] text-grey">{r.due < 0 ? `${-r.due} din late` : `due ${dayStr(r.due)}`}</div>}
                </td>
                <td className="px-3 py-2.5 text-right"><RemindBtn r={r} flash={flash} /></td>
              </tr>
            ))}
            <tr className="border-t-2 border-navy/80 bg-mist font-semibold">
              <td className="px-4 py-2.5" colSpan={2}>{rows.length} invoices</td>
              <td className="tnum px-3 py-2.5 text-right">{inr(total)}</td><td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Overview({ go, filter, setFilter, flash }) {
  const counts = COLLECT_ROWS.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {})
  const pct = Math.round((6.1 / 8.4) * 100) // deck slide 9 illustrative figures: ₹6.1 L of ₹8.4 L
  return (
    <>
      <Head title="Is hafte ka collection" sub="This week · invoices sent, seen and paid, matched to invoice numbers" />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {COLLECT_TILES.map((t, i) => {
          const link = TILE_LINK[i]
          const body = (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13px] font-medium text-grey">{t.hi}</div>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky text-navy"><Icon name={TILE_ICON[i]} size={16} /></span>
              </div>
              <div className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink">{t.value}</div>
              <div className="mt-1.5 flex items-center justify-between text-[12px] text-grey">{t.en}{link && <Icon name="chevron" size={14} />}</div>
            </>
          )
          return link
            ? <button key={t.en} onClick={() => go(link[0], link[1])} className={`${card} p-4 text-left transition hover:ring-cyan`}>{body}</button>
            : <div key={t.en} className={`${card} p-4`}>{body}</div>
        })}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <div className={`${card} p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">Collected vs sent <DemoTag /></div>
            <div className="text-[13px] text-grey"><b className="text-ink">₹6.1 L</b> of ₹8.4 L · {pct}%</div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-sky" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Collected vs sent">
            <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-grey">
            Paid in Chukta lands on your chosen rail (Paytm QR or bank a/c), already matched to the invoice.
            <button onClick={() => go('settlements')} className="font-semibold text-navy underline">See settlements</button>
          </div>
        </div>
        <div className={`${card} p-4`}>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">Status · {COLLECT_ROWS.length} invoices <DemoTag /></div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {Object.keys(COLLECT_STATUS).map((k) => (
              <button key={k} onClick={() => setFilter(filter === k ? 'all' : k)}
                className={`flex items-center justify-between rounded-lg px-1.5 py-1 text-left text-[12.5px] hover:bg-mist ${filter === k ? 'bg-mist ring-1 ring-line' : ''}`}>
                <Status s={k} /><b className="tnum text-ink">{counts[k] || 0}</b>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3"><InvoiceTable filter={filter} setFilter={setFilter} flash={flash} /></div>
    </>
  )
}

function Retailers({ flash }) {
  const list = useMemo(() => {
    const m = new Map()
    for (const r of COLLECT_ROWS) {
      const x = m.get(r.retailer) || { name: r.retailer, area: r.area, invoices: 0, billed: 0, outstanding: 0, rows: [] }
      x.invoices += 1; x.billed += r.amount; x.rows.push(r)
      if (r.status !== 'paid') x.outstanding += r.amount
      m.set(r.retailer, x)
    }
    return [...m.values()].sort((a, b) => b.outstanding - a.outstanding)
  }, [])
  const out = list.reduce((s, x) => s + x.outstanding, 0)
  return (
    <>
      <Head title="Retailers" sub={`${list.length} retailers billed this week · ${inr(out)} outstanding`} />
      <div className={`mt-4 overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-mist text-left text-[11.5px] font-semibold uppercase tracking-wide text-grey">
                <th className="px-4 py-2.5">Retailer</th><th className="px-3 py-2.5 text-right">Invoices</th>
                <th className="px-3 py-2.5 text-right">Billed</th><th className="px-3 py-2.5 text-right">Outstanding</th><th className="px-3 py-2.5">Latest</th><th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {list.map((x) => {
                const last = x.rows[x.rows.length - 1]
                return (
                  <tr key={x.name} className="border-t border-line/70 hover:bg-[#F8FBFE]">
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={x.name} size={30} />
                      <div><div className="font-semibold text-ink">{x.name}</div><div className="text-[12px] text-grey">{x.area}</div></div></div></td>
                    <td className="tnum px-3 py-2.5 text-right">{x.invoices}</td>
                    <td className="tnum px-3 py-2.5 text-right">{inr(x.billed)}</td>
                    <td className={`tnum px-3 py-2.5 text-right font-semibold ${x.outstanding ? 'text-ink' : 'text-ok'}`}>{x.outstanding ? inr(x.outstanding) : 'Nil'}</td>
                    <td className="px-3 py-2.5"><Status s={last.status} /></td>
                    <td className="px-3 py-2.5 text-right"><RemindBtn r={last} flash={flash} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Settlements() {
  const paid = COLLECT_ROWS.filter((r) => r.status === 'paid').sort((a, b) => b.paid - a.paid)
  const byRail = paid.reduce((m, r) => ({ ...m, [r.rail]: (m[r.rail] || 0) + r.amount }), {})
  const total = paid.reduce((s, r) => s + r.amount, 0)
  return (
    <>
      <Head title="Settlements" sub="Payments received through Chukta, each matched to its invoice number" />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={`${card} p-4`}><div className="text-[13px] text-grey">Received (this list)</div><div className="mt-1 text-[26px] font-semibold text-ink">{inr(total)}</div><div className="text-[12px] text-grey">{paid.length} invoices, all matched</div></div>
        {Object.entries(RAIL).map(([k, l]) => (
          <div key={k} className={`${card} p-4`}><div className="flex items-center gap-1.5 text-[13px] text-grey"><Icon name={k === 'qr' ? 'qr' : 'bank'} size={15} />{l}</div>
            <div className="mt-1 text-[26px] font-semibold text-ink">{inr(byRail[k] || 0)}</div><div className="text-[12px] text-grey">{k === 'qr' ? 'merchant QR payments' : 'UPI to your bank account'}</div></div>
        ))}
      </div>
      <div className={`mt-3 overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[14px]">
            <thead>
              <tr className="bg-mist text-left text-[11.5px] font-semibold uppercase tracking-wide text-grey">
                <th className="px-4 py-2.5">Paid on</th><th className="px-3 py-2.5">Retailer</th><th className="px-3 py-2.5">Invoice</th>
                <th className="px-3 py-2.5">Rail</th><th className="px-3 py-2.5 text-right">Amount</th><th className="px-3 py-2.5">Reconciliation</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((r) => (
                <tr key={r.invoice} className="border-t border-line/70">
                  <td className="whitespace-nowrap px-4 py-2.5 text-grey">{dayStr(r.paid)}</td>
                  <td className="px-3 py-2.5 font-semibold text-ink">{r.retailer}</td>
                  <td className="px-3 py-2.5 text-ink2">#{r.invoice}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{RAIL[r.rail]}</td>
                  <td className="tnum px-3 py-2.5 text-right font-semibold">{inr(r.amount)}</td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1 rounded-full bg-okbg px-2 py-0.5 text-[12px] font-semibold text-ok"><Icon name="check" size={13} strokeWidth={2.4} />INV-{r.invoice} matched</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-grey">The invoice number travels in the UPI note (<code>tn=INV-…</code>), so each payment closes its invoice without manual matching.</p>
    </>
  )
}

function Tally({ flash }) {
  const paid = COLLECT_ROWS.filter((r) => r.status === 'paid').sort((a, b) => a.paid - b.paid)
  const head = ['Date', 'Voucher Type', 'Party Name', 'Bill Ref', 'Amount', 'Mode', 'Narration']
  const body = paid.map((r) => [isoStr(r.paid), 'Receipt', r.retailer, r.invoice, r.amount, RAIL[r.rail], `Chukta INV-${r.invoice} (DEMO)`])
  const exp = () => { download(`chukta_tally_receipts_demo_${isoStr(0)}.csv`, toCsv([head, ...body])); flash(`${body.length} receipt vouchers exported (CSV, demo data)`) }
  return (
    <>
      <Head title="Tally / Marg export" sub="Receipt vouchers for payments received in Chukta, ready to import">
        <button onClick={exp} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-navy px-4 text-[14px] font-semibold text-white hover:bg-navy2">
          <Icon name="download" size={16} />Download CSV
        </button>
      </Head>
      <div className={`mt-4 overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[13.5px]">
            <thead><tr className="bg-mist text-left text-[11.5px] font-semibold uppercase tracking-wide text-grey">{head.map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr></thead>
            <tbody>{body.map((row) => <tr key={row[3]} className="border-t border-line/70">{row.map((v, i) => <td key={i} className={`px-3 py-2.5 ${i === 4 ? 'tnum text-right font-semibold' : ''}`}>{i === 4 ? inr(v) : v}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className={`mt-3 ${card} p-4 text-[13px] text-ink2`}>
        <b className="text-navy">How it works in the pilot:</b> export this CSV and import it as Receipt vouchers (Tally: Import Data; Marg: Excel import).
        A live ERP connection (Tally / Marg / Busy, Bharat Connect) is phase 2; it isn't built in this prototype.
      </div>
    </>
  )
}

export default function Collect() {
  const [params, setParams] = useSearchParams()
  const view = VIEWS.some(([k]) => k === params.get('view')) ? params.get('view') : 'overview'
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2600) }
  const go = (v, f) => { if (f) setFilter(f); setParams(v === 'overview' ? {} : { view: v }) }
  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById(`tab-${view}`)?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [view])

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-navy p-5 text-white lg:flex">
        <button onClick={() => go('overview')} className="text-left">
          <div className="text-[19px] font-extrabold tracking-tight">Paytm <span className="text-cyan">Chukta</span></div>
          <div className="text-[12px] text-white/60">Collect · for distributors</div>
        </button>
        <nav className="mt-8 space-y-1 text-[14px] font-medium">
          {VIEWS.map(([k, ic, l]) => (
            <button key={k} onClick={() => go(k)} aria-current={view === k ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${view === k ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'}`}>
              <Icon name={ic} size={18} />{l}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/8 p-3 text-[12px] text-white/70">
          <Icon name="info" size={16} className="mb-1 text-cyan" />
          Reminders go by Soundbox / push, never as a UPI collect request.
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <Avatar name="Sharma Traders" size={38} />
              <div>
                <div className="text-[16px] font-bold text-ink">Sharma Traders</div>
                <div className="text-[12px] text-grey">FMCG distributor · Kanpur <span className="lg:hidden">· Paytm Chukta Collect</span></div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link to="/" className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-navy ring-1 ring-line hover:bg-mist"><Icon name="phone" size={16} />Merchant app</Link>
            </div>
          </div>
          {/* phone / tablet: the sidebar becomes a tab row */}
          <nav className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
            {VIEWS.map(([k, ic, l]) => (
              <button key={k} id={`tab-${k}`} onClick={() => go(k)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${view === k ? 'bg-navy text-white' : 'bg-mist text-ink2'}`}>
                <Icon name={ic} size={15} />{l}
              </button>
            ))}
          </nav>
          <div className="flex items-center justify-center gap-1.5 bg-[#FFF6E0] px-4 py-1 text-center text-[11.5px] font-semibold text-warn">
            <Icon name="shield" size={13} />PROTOTYPE · DEMO DATA (illustrative, as on deck slide 9) · no real retailers, invoices or payments
          </div>
        </header>

        <main key={view} className="animate-in mx-auto max-w-6xl px-4 py-6 md:px-8">
          {view === 'overview' && <Overview go={go} filter={filter} setFilter={setFilter} flash={flash} />}
          {view === 'invoices' && (
            <>
              <Head title="Invoices" sub="Every invoice sent to retailers this week, with its payment status" />
              <div className="mt-4"><InvoiceTable filter={filter} setFilter={setFilter} flash={flash} /></div>
            </>
          )}
          {view === 'retailers' && <Retailers flash={flash} />}
          {view === 'settlements' && <Settlements />}
          {view === 'tally' && <Tally flash={flash} />}

          <p className="mt-6 text-[12px] leading-relaxed text-grey">
            P2P collect requests are discontinued by NPCI (since 1 Oct 2025), so Chukta never sends one. Tally / Marg export is CSV in the pilot.
          </p>
          <p className="mt-2 text-[11.5px] text-grey/80">{ABOUT}</p>
        </main>
      </div>
      {msg && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="animate-in rounded-xl bg-ink px-4 py-2.5 text-[13.5px] font-medium text-white shadow-lg">{msg}</div>
        </div>
      )}
    </div>
  )
}
