import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BillCard from '../components/BillCard.jsx'
import { Avatar, Bi, Card, Chip, DemoTag, SectionTitle, Shell } from '../components/ui.jsx'
import { balance, useStore } from '../store.jsx'
import { DEMO_TODAY_IN, MERCHANT } from '../data/demo.js'
import { daysFromToday, inr, shortDate, timeOf } from '../lib/fmt.js'

const TABS = [['due', 'Dena hai', 'to pay'], ['paid', 'Diya', 'paid'], ['suppliers', 'Suppliers', 'payees']]

function Hero({ weekCount }) {
  return (
    <div className="bg-[linear-gradient(160deg,#002E6E_0%,#0A3D86_100%)] px-4 pb-14 pt-3">
      <div className="flex items-center gap-3">
        <Avatar name={MERCHANT.name} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{MERCHANT.name}</div>
          <div className="truncate text-[11.5px] text-white/65">Paytm for Business · <span className="font-semibold text-cyan">Chukta</span></div>
        </div>
        <Link to="/soundbox" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10">
          <Icon name="bell" size={20} />
          {weekCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-badfill ring-2 ring-navy" />}
        </Link>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <Bi hi="Aaj aaye" en="received today" className="text-[13px] font-medium text-white/80" enClass="text-white/60" />
          <div className="mt-1 text-[38px] font-bold leading-none tracking-tight">{inr(DEMO_TODAY_IN)}</div>
        </div>
        <DemoTag />
      </div>
    </div>
  )
}

export default function Inbox() {
  const { bills, suppliers: added, settings, resetDemo } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'due'
  const navigate = useNavigate()

  const open = bills.filter((b) => b.status === 'due').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const disputed = bills.filter((b) => b.status === 'disputed')
  const paid = bills.filter((b) => (b.payments || []).length).flatMap((b) => b.payments.map((p) => ({ ...p, bill: b })))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
  const week = open.filter((b) => daysFromToday(b.dueDate) <= 7)
  const weekTotal = week.reduce((s, b) => s + balance(b), 0)
  const groups = [
    ['Jaldi dena hai', 'today / tomorrow / overdue', open.filter((b) => daysFromToday(b.dueDate) <= 1)],
    ['Is hafte', 'this week', open.filter((b) => { const n = daysFromToday(b.dueDate); return n > 1 && n <= 7 })],
    ['Baad mein', 'later', open.filter((b) => daysFromToday(b.dueDate) > 7)],
  ].filter((g) => g[2].length)

  const suppliers = useMemo(() => {
    const m = new Map()
    for (const s of added) m.set(s.name.toLowerCase(), { name: s.name, gstin: s.gstin, rail: s.rail, open: 0, count: 0, added: true })
    for (const b of bills) {
      const k = b.supplier.toLowerCase()
      const s = m.get(k) || { name: b.supplier, gstin: b.gstin, rail: b.rail, open: 0, count: 0, demo: b.demo }
      s.count += 1
      if (b.status === 'due') s.open += balance(b)
      m.set(k, s)
    }
    return [...m.values()]
  }, [bills, added])

  const quick = [
    ['scan', 'Bill scan', 'add bill', '/capture'],
    ['users', 'Supplier', 'add payee', '/supplier/new'],
    ['moon', `${settings.reminderOn ? 'On' : 'Off'} · 9 pm`, 'reminder', '/soundbox#reminder'],
    ['layout', 'Collect', 'distributor', '/collect'],
  ]

  return (
    <Shell hero={<Hero weekCount={week.length} />}>
      {/* due-this-week card overlaps the navy hero */}
      <Card className="-mt-14 p-0">
        <div className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-badbg text-bad"><Icon name="receipt" size={22} /></span>
          <div className="min-w-0 flex-1">
            <Bi hi="Is hafte dena hai" en="due this week" className="text-[13px] font-medium text-grey" />
          </div>
          <div className="text-right">
            <div className="text-[22px] font-bold leading-none text-ink">{inr(weekTotal)}</div>
            <div className="mt-1 text-[12px] font-semibold text-bad">{week.length} bills</div>
          </div>
        </div>
        {week[0] && (
          <button onClick={() => navigate(`/payee/${week[0].id}`)}
            className="flex w-full items-center gap-2 rounded-b-2xl border-t border-line/70 bg-sky/50 px-4 py-2.5 text-left text-[13px] text-navy">
            <Icon name="zap" size={16} className="text-cyan2" />
            <span className="min-w-0 flex-1 truncate">Agla: <b>{week[0].supplier}</b> · {inr(balance(week[0]))}</span>
            <span className="font-semibold">Chukta karein</span><Icon name="chevron" size={16} />
          </button>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {quick.map(([ic, hi, en, to]) => (
          <Link key={en} to={to} className="flex flex-col items-center gap-1.5 rounded-2xl p-1 text-center active:bg-white">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-navy shadow-[var(--shadow-card)] ring-1 ring-line/70"><Icon name={ic} size={22} /></span>
            <Bi hi={hi} en={en} className="text-[11.5px] font-semibold leading-tight text-ink" enClass="text-[10px]" />
          </Link>
        ))}
      </div>

      <div role="tablist" className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-[#E6ECF3] p-1">
        {TABS.map(([k, hi, en]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams(k === 'due' ? {} : { tab: k }, { replace: true })}
            className={`rounded-xl px-2 py-1.5 text-[14px] font-semibold leading-tight transition ${tab === k ? 'bg-white text-navy shadow-sm' : 'text-grey'}`}>
            {hi}<span className="block text-[10px] font-medium opacity-70">{en}</span>
          </button>
        ))}
      </div>

      {tab === 'due' && (
        <>
          {groups.length === 0 && <Card className="mt-3 text-center text-grey">Koi bill baaki nahi. Sab chukta!</Card>}
          {groups.map(([hi, en, list]) => (
            <div key={hi}>
              <SectionTitle right={<span className="text-[12px] text-grey">{en}</span>}>{hi}</SectionTitle>
              <div className="space-y-3">{list.map((b) => <BillCard key={b.id} bill={b} />)}</div>
            </div>
          ))}
          {disputed.length > 0 && (
            <>
              <SectionTitle right={<span className="text-[12px] text-grey">disputed</span>}>Galat bill</SectionTitle>
              <div className="space-y-3">{disputed.map((b) => <BillCard key={b.id} bill={b} />)}</div>
            </>
          )}
          <Link to="/capture"
            className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-dashed border-[#A9BCD3] bg-white/60 p-4 text-navy active:bg-sky">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky"><Icon name="camera" size={22} /></span>
            <Bi hi="Bill ki photo / QR scan" en="baaki Paytm karega · we'll read the rest" className="text-[15px] font-semibold" />
          </Link>
        </>
      )}

      {tab === 'paid' && (
        <div className="mt-3 space-y-2">
          {paid.length === 0 && <Card className="text-center text-grey">Abhi koi payment nahi</Card>}
          {paid.map((p, i) => (
            <Card key={i} as="button" onClick={() => navigate(`/bill/${p.bill.id}`)} className="flex w-full items-center gap-3 p-3.5 text-left">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-okbg text-ok"><Icon name="check" size={20} strokeWidth={2.4} /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{p.bill.supplier}</div>
                <div className="text-[12px] text-grey">Inv #{p.bill.invoiceNo} · {daysFromToday(p.at) === 0 ? `Aaj ${timeOf(p.at)}` : shortDate(p.at)}</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold">{inr(p.amount)}</div>
                {p.bill.demo && <DemoTag />}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="mt-3 space-y-2">
          <Link to="/supplier/new" className="flex items-center gap-3 rounded-2xl bg-navy p-3.5 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><Icon name="plus" size={22} /></span>
            <Bi hi="Supplier jodein" en="add a supplier you pay" className="text-[15px] font-semibold" enClass="text-white/70" />
          </Link>
          {suppliers.map((s) => (
            <Card key={s.name} className="flex items-center gap-3 p-3.5">
              <Avatar name={s.name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{s.name}</div>
                <div className="flex items-center gap-1 text-[12px] text-grey">
                  <Icon name={s.rail === 'bank' ? 'bank' : 'qr'} size={13} />
                  {s.rail === 'bank' ? 'Bank a/c' : 'UPI / QR'} · {s.count} bill{s.count === 1 ? '' : 's'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold">{s.open ? inr(s.open) : 'Sab chukta'}</div>
                {s.demo ? <DemoTag /> : s.added ? <Chip tone="ok">jodha</Chip> : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button className="text-[12px] text-grey underline" onClick={() => { if (confirm('Demo bills reset karein? Aapke jode hue bills hat jayenge.')) resetDemo() }}>
          Demo reset karein (reset demo bills)
        </button>
      </div>
    </Shell>
  )
}
