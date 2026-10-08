import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LOG_SCHEMA } from '../data/logSchema.js'
import { load, save, useStore } from '../store.jsx'
import { copyText, download, toCsv, toTsv } from '../lib/csv.js'
import { isoDay } from '../lib/fmt.js'

// Field logger. Columns and dropdown options come from the workbook (data/logSchema.js), in the same order,
// so exported rows paste straight into "R2 Validation Log" / "Distributor Log" from row 6.

const AREAS = ['Kalyanpur', 'Kakadeo', 'Nankari', 'Swaroop Nagar', 'IITK', 'MT Section', 'Generalganj / Nayaganj']
const NUMERIC = new Set(['H', 'K', 'U', 'E', 'F', 'G', 'J', 'L'])
const LONG = /exact words|notes|quote/i
const SECTIONS = {
  merchant: [['A', 'Respondent'], ['H', 'Last real supplier payment (S3)'], ['L', 'Stage A · concept'], ['P', 'Stage B · prototype tasks'], ['W', 'Stage C · commitment ladder']],
  distributor: [['A', 'Distributor'], ['H', 'Billing + collections'], ['M', 'Commitment']],
}
const KEY = (kind) => `chukta.log.${kind}.v1`
const PREFIX = { merchant: 'M', distributor: 'D' }

function nextId(kind, rows) {
  const n = rows.reduce((m, r) => Math.max(m, parseInt(String(r.A || '').replace(/\D/g, ''), 10) || 0), 0) + 1
  return PREFIX[kind] + String(n).padStart(2, '0')
}
const blank = (kind, rows) => ({ A: nextId(kind, rows), B: isoDay(new Date().toISOString()) })

function Stopwatch({ onStop }) {
  const [t0, setT0] = useState(null)
  const [now, setNow] = useState(0)
  const timer = useRef(null)
  useEffect(() => () => clearInterval(timer.current), [])
  const start = () => { const s = Date.now(); setT0(s); setNow(s); timer.current = setInterval(() => setNow(Date.now()), 250) }
  const stop = () => { clearInterval(timer.current); onStop(Math.round((Date.now() - t0) / 1000)); setT0(null) }
  return t0 ? (
    <button type="button" onClick={stop} className="rounded-lg bg-bad px-3 py-2 text-[14px] font-bold text-white">■ Stop {Math.round((now - t0) / 1000)}s</button>
  ) : (
    <button type="button" onClick={start} className="rounded-lg bg-ok px-3 py-2 text-[14px] font-bold text-white">▶ T3 timer</button>
  )
}

function Input({ col, value, onChange }) {
  const cls = 'w-full min-h-11 rounded-lg border border-line bg-white px-3 py-2 text-[16px] outline-none focus:border-cyan'
  if (col.options) {
    if (col.options.length <= 5 && col.options.every((o) => o.length <= 16)) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {col.options.map((o) => (
            <button type="button" key={o} onClick={() => onChange(value === o ? '' : o)}
              className={`min-h-10 rounded-full px-3 text-[14px] font-semibold ${value === o ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}>{o}</button>
          ))}
        </div>
      )
    }
    return (
      <select className={cls} value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {col.options.map((o) => <option key={o}>{o}</option>)}
      </select>
    )
  }
  if (col.col === 'B') return <input type="date" className={cls} value={value || ''} onChange={(e) => onChange(e.target.value)} />
  if (col.col === 'C') return (
    <>
      <input className={cls} list="areas" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      <datalist id="areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist>
    </>
  )
  if (LONG.test(col.name)) return <textarea rows={2} className={cls} value={value || ''} onChange={(e) => onChange(e.target.value)} />
  return <input className={cls} inputMode={NUMERIC.has(col.col) ? 'decimal' : 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} />
}

// Suggestions from what the respondent actually did in the prototype (never auto-applied).
function suggestions(events, id) {
  const ev = events.filter((e) => e.respondent === id && !e.demoBill && !e.sample)
  const out = []
  const cap = ev.filter((e) => e.type === 'capture').at(-1)
  if (cap && cap.route !== 'Manual') out.push(['Q', cap.route], ['R', cap.fieldsCorrect])
  const added = ev.filter((e) => e.type === 'L2_supplier_added').length
  const rem = ev.filter((e) => e.type.startsWith('L2_reminder')).at(-1)
  if (added && rem?.type === 'L2_reminder_on') out.push(['X', 'Yes'])
  const l3 = ev.filter((e) => e.type === 'L3').at(-1)
  if (l3) out.push(['Y', l3.l3])
  return out
}

export default function FieldLog() {
  const { events, setEvents, respondent, setRespondent } = useStore()
  const [kind, setKind] = useState('merchant')
  const schema = LOG_SCHEMA[kind] || null
  const [rows, setRows] = useState(() => ({ merchant: load(KEY('merchant'), []), distributor: load(KEY('distributor'), []) }))
  const [form, setForm] = useState(() => blank('merchant', load(KEY('merchant'), [])))
  const [editing, setEditing] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { save(KEY('merchant'), rows.merchant) }, [rows.merchant])
  useEffect(() => { save(KEY('distributor'), rows.distributor) }, [rows.distributor])
  useEffect(() => { if (kind === 'merchant' && form.A) setRespondent(form.A) }, [kind, form.A, setRespondent])

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2200) }
  const switchKind = (k) => { setKind(k); setEditing(null); if (k !== 'events') setForm(blank(k, rows[k])) }
  const set = (c) => (v) => setForm((f) => ({ ...f, [c]: v }))

  const saveRow = () => {
    const list = rows[kind]
    const next = editing != null ? list.map((r, i) => (i === editing ? form : r)) : [...list, form]
    setRows((r) => ({ ...r, [kind]: next }))
    setEditing(null)
    setForm(blank(kind, next))
    flash(`Saved ${form.A} (phone par). Roz CSV export karein!`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const table = (k) => LOG_SCHEMA[k].columns.map((c) => c.name)
  const asRows = (k) => rows[k].map((r) => LOG_SCHEMA[k].columns.map((c) => r[c.col] ?? ''))
  const sugg = useMemo(() => (kind === 'merchant' ? suggestions(events, form.A) : []), [kind, events, form.A])

  return (
    <div className="mx-auto min-h-dvh max-w-[760px] bg-[#F7FAFD] pb-16">
      <header className="sticky top-0 z-10 bg-navy px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-[16px] font-bold">Field logger <span className="text-[12px] font-normal text-white/70">· for KartikRaj_R2_Annexure.xlsx</span></div>
          <Link to="/" className="text-[13px] text-cyan underline">App</Link>
        </div>
        <div className="mt-2 flex gap-1.5">
          {[['merchant', `Merchants (${rows.merchant.length})`], ['distributor', `Distributors (${rows.distributor.length})`], ['events', 'Prototype log']].map(([k, l]) => (
            <button key={k} onClick={() => switchKind(k)}
              className={`flex-1 rounded-full px-2 py-1.5 text-[13px] font-bold ${kind === k ? 'bg-cyan text-navy' : 'bg-white/10 text-white'}`}>{l}</button>
          ))}
        </div>
      </header>
      {msg && <div className="sticky top-[88px] z-10 bg-okbg px-3 py-2 text-center text-[14px] font-bold text-ok">{msg}</div>}

      {kind === 'events' ? (
        <EventsView events={events} onClear={() => { if (confirm('Prototype log saaf karein?')) setEvents([]) }} />
      ) : (
        <div className="px-3">
          <div className="mt-3 rounded-xl bg-white p-3 text-[12px] text-grey ring-1 ring-line">
            Sheet: <b className="text-navy">{schema.sheet}</b> · paste from row {schema.firstRow}, column A. Data stays on this phone (localStorage) until you export.
            {kind === 'merchant' && <> Current respondent for prototype events: <b className="text-navy">{respondent || '—'}</b></>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); saveRow() }} className="mt-3 space-y-4">
            {schema.columns.map((c) => {
              const sec = SECTIONS[kind].find(([col]) => col === c.col)
              const s = sugg.find(([col]) => col === c.col)
              return (
                <div key={c.col}>
                  {sec && <h3 className="mb-2 mt-6 border-b-2 border-navy pb-1 text-[14px] font-extrabold uppercase tracking-wide text-navy">{sec[1]}</h3>}
                  <label className="mb-1 block text-[14px] font-bold text-ink"><span className="mr-1 text-[11px] text-grey">{c.col}</span>{c.name}</label>
                  <Input col={c} value={form[c.col]} onChange={set(c.col)} />
                  {c.col === 'U' && <div className="mt-2"><Stopwatch onStop={(s2) => set('U')(String(s2))} /></div>}
                  {s && form[c.col] !== s[1] && (
                    <button type="button" onClick={() => set(c.col)(s[1])} className="mt-1 text-[12px] font-semibold text-navy underline">
                      Prototype log says "{s[1]}": apply
                    </button>
                  )}
                </div>
              )
            })}
            <div className="sticky bottom-0 -mx-3 flex gap-2 border-t border-line bg-white p-3">
              <button type="submit" className="min-h-12 flex-1 rounded-xl bg-navy text-[16px] font-bold text-white">{editing != null ? 'Update row' : 'Save row'} {form.A}</button>
              {editing != null && <button type="button" onClick={() => { setEditing(null); setForm(blank(kind, rows[kind])) }} className="rounded-xl bg-mist px-4 font-bold text-navy">Cancel</button>}
            </div>
          </form>

          <section className="mt-6">
            <h3 className="text-[15px] font-extrabold text-navy">Saved rows ({rows[kind].length})</h3>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button onClick={() => download(`${kind === 'merchant' ? 'R2_Validation_Log' : 'Distributor_Log'}_${isoDay(new Date().toISOString())}.csv`, toCsv([table(kind), ...asRows(kind)]))}
                className="min-h-11 rounded-lg bg-navy font-bold text-white">⬇ CSV (with header)</button>
              <button onClick={async () => flash((await copyText(toTsv(asRows(kind)))) ? 'Rows copied: paste into Excel at A6' : 'Copy failed')}
                className="min-h-11 rounded-lg bg-cyan font-bold text-navy">📋 Copy rows for Excel</button>
              <button onClick={async () => flash((await copyText(toTsv([table(kind), ...asRows(kind)]))) ? 'Copied with header' : 'Copy failed')}
                className="min-h-11 rounded-lg bg-mist font-bold text-navy">📋 Copy with header</button>
            </div>
            <div className="mt-2 space-y-2">
              {rows[kind].map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white p-2 text-[13px] ring-1 ring-line">
                  <b className="text-navy">{r.A}</b>
                  <span className="min-w-0 flex-1 truncate text-grey">{[r.B, r.C, r.D].filter(Boolean).join(' · ')}</span>
                  <button onClick={() => { setEditing(i); setForm(r); window.scrollTo({ top: 0 }) }} className="rounded bg-mist px-2 py-1 font-bold text-navy">Edit</button>
                  <button onClick={() => { if (confirm(`Delete ${r.A}?`)) setRows((x) => ({ ...x, [kind]: x[kind].filter((_, j) => j !== i) })) }} className="rounded bg-badbg px-2 py-1 font-bold text-bad">Del</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function EventsView({ events, onClear }) {
  const head = ['at', 'respondent', 'type', 'billId', 'demo', 'route', 'via', 'fieldsCorrect', 'result', 'l3', 'how', 'amount', 'reason']
  const rows = events.map((e) => [e.at, e.respondent, e.type, e.billId, e.demoBill || e.sample ? 'demo' : '', e.route, e.via, e.fieldsCorrect, e.result, e.l3, e.how, e.amount, e.reason])
  return (
    <div className="px-3">
      <p className="mt-3 text-[12px] text-grey">
        What the prototype recorded (capture route, fields read correctly, payee check, L3). Rows marked <b>demo</b> came from demo bills or the sample QR: never count them as field data.
      </p>
      <div className="mt-2 flex gap-2">
        <button onClick={() => download(`prototype_events_${isoDay(new Date().toISOString())}.csv`, toCsv([head, ...rows]))} className="min-h-11 flex-1 rounded-lg bg-navy font-bold text-white">⬇ Events CSV</button>
        <button onClick={onClear} className="min-h-11 rounded-lg bg-badbg px-4 font-bold text-bad">Clear</button>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg ring-1 ring-line">
        <table className="w-full min-w-[640px] bg-white text-[12px]">
          <thead><tr className="bg-mist text-left">{head.map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
          <tbody>{rows.slice().reverse().map((r, i) => (
            <tr key={i} className="border-t border-line">{r.map((v, j) => <td key={j} className="px-2 py-1">{j === 0 ? new Date(v).toLocaleString('en-IN') : String(v ?? '')}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
