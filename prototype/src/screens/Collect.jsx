import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Avatar, DemoTag } from '../components/ui.jsx'
import { ABOUT } from '../components/about.js'
import { COLLECT_ROWS, COLLECT_STATUS, COLLECT_TILES } from '../data/demo.js'
import { download, toCsv } from '../lib/csv.js'
import { inr } from '../lib/fmt.js'

const dayStr = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }
const isoStr = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10) }
const ST_ICON = { paid: 'checkCircle', seen: 'info', sent: 'send', later: 'calendar', overdue: 'clock', dispute: 'flag' }
const TILE_ICON = ['send', 'checkCircle', 'store', 'zap']

function Status({ s }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-semibold ${COLLECT_STATUS[s].cls}`}>
      <Icon name={ST_ICON[s]} size={13} strokeWidth={2.2} />{COLLECT_STATUS[s].hi}
    </span>
  )
}

export default function Collect() {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const rows = useMemo(() => COLLECT_ROWS.filter((r) =>
    (filter === 'all' || r.status === filter) && (!q || (r.retailer + r.invoice + r.area).toLowerCase().includes(q.toLowerCase()))), [filter, q])
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const counts = COLLECT_ROWS.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {})
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2600) }

  const exportCsv = () => {
    const head = ['Retailer', 'Area', 'Invoice', 'Amount (INR)', 'Sent on', 'Status', 'Due', 'Data']
    const body = rows.map((r) => [r.retailer, r.area, r.invoice, r.amount, isoStr(r.sent), COLLECT_STATUS[r.status].hi, r.due != null ? isoStr(r.due) : '', 'DEMO'])
    download(`chukta_collect_demo_${isoStr(0)}.csv`, toCsv([head, ...body]))
  }

  // Meter: collected vs sent this week (deck slide 9 illustrative figures: ₹6.1 L of ₹8.4 L).
  const pct = Math.round((6.1 / 8.4) * 100)

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy p-5 text-white lg:flex">
        <div className="text-[19px] font-extrabold tracking-tight">Paytm <span className="text-cyan">Chukta</span></div>
        <div className="text-[12px] text-white/60">Collect · for distributors</div>
        <nav className="mt-8 space-y-1 text-[14px] font-medium">
          {[['grid', 'Overview', true], ['receipt', 'Invoices'], ['store', 'Retailers'], ['bank', 'Settlements'], ['download', 'Tally export']].map(([ic, l, on]) => (
            <div key={l} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${on ? 'bg-white/12 text-white' : 'text-white/60'}`}><Icon name={ic} size={18} />{l}</div>
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
          <div className="flex items-center justify-center gap-1.5 bg-[#FFF6E0] px-4 py-1 text-center text-[11.5px] font-semibold text-warn">
            <Icon name="shield" size={13} />PROTOTYPE · DEMO DATA (illustrative, as on deck slide 9) · no real retailers, invoices or payments
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="flex items-center gap-2 text-[22px] font-bold tracking-tight text-ink">Is hafte ka collection <DemoTag>demo data</DemoTag></h1>
              <p className="text-[13px] text-grey">This week · invoices sent, seen and paid, matched to invoice numbers</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {COLLECT_TILES.map((t, i) => (
              <div key={t.en} className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-line/70">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13px] font-medium text-grey">{t.hi}</div>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky text-navy"><Icon name={TILE_ICON[i]} size={16} /></span>
                </div>
                <div className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink">{t.value}</div>
                <div className="mt-1.5 text-[12px] text-grey">{t.en}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-line/70">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">Collected vs sent <DemoTag /></div>
                <div className="text-[13px] text-grey"><b className="text-ink">₹6.1 L</b> of ₹8.4 L · {pct}%</div>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-sky" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Collected vs sent">
                <div className="h-full rounded-full bg-cyan" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 text-[12px] text-grey">Paid in Chukta lands on your chosen rail (Paytm QR or bank a/c), already matched to the invoice.</div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-line/70">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">Status · {COLLECT_ROWS.length} invoices <DemoTag /></div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {Object.keys(COLLECT_STATUS).map((k) => (
                  <button key={k} onClick={() => setFilter(filter === k ? 'all' : k)}
                    className={`flex items-center justify-between rounded-lg px-1.5 py-1 text-left text-[12.5px] hover:bg-mist ${filter === k ? 'bg-mist' : ''}`}>
                    <Status s={k} /><b className="tnum text-ink">{counts[k] || 0}</b>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-3 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-line/70">
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
                  {rows.map((r) => (
                    <tr key={r.invoice} className="border-t border-line/70 hover:bg-[#F8FBFE]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5"><Avatar name={r.retailer} size={30} />
                          <div><div className="font-semibold text-ink">{r.retailer}</div><div className="text-[12px] text-grey">{r.area}</div></div></div>
                      </td>
                      <td className="px-3 py-2.5 text-ink2">#{r.invoice}</td>
                      <td className="tnum px-3 py-2.5 text-right font-semibold">{inr(r.amount)}</td>
                      <td className="px-3 py-2.5 text-grey">{dayStr(r.sent)}</td>
                      <td className="px-3 py-2.5">
                        <Status s={r.status} />
                        {r.due != null && r.status !== 'paid' && <div className="mt-0.5 text-[11.5px] text-grey">{r.due < 0 ? `${-r.due} din late` : `due ${dayStr(r.due)}`}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {['sent', 'seen', 'overdue'].includes(r.status) && (
                          <button onClick={() => flash(`Demo: ${r.retailer} ko Soundbox + push reminder (UPI collect request kabhi nahi)`)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-navy ring-1 ring-line hover:bg-sky">
                            <Icon name="bell" size={14} />Remind
                          </button>
                        )}
                      </td>
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

          <p className="mt-4 text-[12px] leading-relaxed text-grey">
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
