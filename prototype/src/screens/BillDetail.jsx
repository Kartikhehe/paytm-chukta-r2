import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { DueChip } from '../components/BillCard.jsx'
import { Avatar, Btn, Card, Chip, DemoTag, Sheet, Shell, toast } from '../components/ui.jsx'
import { balance, paidSoFar, useStore } from '../store.jsx'
import { EINV_FIELDS } from '../lib/einvoice.js'
import { inr, shortDate, timeOf } from '../lib/fmt.js'

const REASONS = ['Rakam galat (wrong amount)', 'Maal kam aaya (short supply)', 'Duplicate bill', 'Rate galat (wrong rate)', 'Kuch aur (other)']
const HOW = { intent: 'UPI link', qr: 'QR scan in Paytm', bank: 'Paytm bank transfer' }

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3 py-2 text-[13.5px]">
      <span className="text-grey">{k}</span><span className="min-w-0 break-all text-right font-medium text-ink">{v}</span>
    </div>
  )
}

export default function BillDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { bills, updateBill, logEvent, settings } = useStore()
  const bill = bills.find((b) => b.id === id)
  const [sheet, setSheet] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  if (!bill) return <Navigate to="/" replace />

  const due = new Date(bill.dueDate)
  const remindAt = new Date(due); remindAt.setDate(due.getDate() - 1); remindAt.setHours(21, 0, 0, 0)
  const timeline = [
    { icon: 'receipt', t: `Bill aaya · ${bill.source || 'added'}`, s: shortDate(bill.billDate), done: true },
    { icon: 'speaker', t: settings.reminderOn ? 'Soundbox reminder, 9 pm' : 'Reminder off (Soundbox screen se on karein)', s: shortDate(remindAt.toISOString()), done: remindAt < new Date() && settings.reminderOn },
    ...(bill.payments || []).map((p) => ({ icon: 'check', t: `${inr(p.amount)} diya · ${HOW[p.how] || 'Paytm'}`, s: `${shortDate(p.at)} ${timeOf(p.at)}`, done: true, ok: true })),
    ...(bill.status === 'due' ? [{ icon: 'clock', t: `Due · ${inr(balance(bill))} baaki`, s: shortDate(bill.dueDate), done: false }] : []),
    ...(bill.status === 'disputed' ? [{ icon: 'flag', t: `Galat bill: ${bill.disputeReason}`, s: 'distributor ko bheja', done: true, bad: true }] : []),
  ]

  const dispute = () => {
    updateBill(bill.id, { status: 'disputed', disputeReason: reason })
    logEvent('dispute', { billId: bill.id, demoBill: !!bill.demo, reason })
    setSheet(false)
    toast('Galat bill: distributor ko bheja (demo)')
  }

  return (
    <Shell title="Bill" sub={bill.supplier} back={-1} footer={bill.status === 'due' && (
      <div className="grid grid-cols-2 gap-2">
        <Btn onClick={() => navigate(`/payee/${bill.id}`)}>Chukta karein</Btn>
        <Btn variant="outline" onClick={() => navigate(`/later/${bill.id}`)}>7 din baad</Btn>
      </div>
    )}>
      <Card className="text-center">
        <div className="flex justify-center"><Avatar name={bill.supplier} size={56} /></div>
        <div className="mt-2 text-[17px] font-semibold">{bill.supplier}</div>
        <div className="mt-1 text-[34px] font-bold tracking-tight text-ink">{inr(bill.amount)}</div>
        {paidSoFar(bill) > 0 && bill.status !== 'paid' && <div className="text-[13px] text-grey">{inr(paidSoFar(bill))} diya · <b className="text-ink">{inr(balance(bill))} baaki</b></div>}
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {bill.status === 'paid' ? <Chip tone="ok" icon="checkCircle">Chukta</Chip> : bill.status === 'disputed' ? <Chip tone="bad" icon="flag">Galat bill</Chip> : <DueChip iso={bill.dueDate} />}
          {bill.einvoice && <Chip tone="ok" icon="shieldCheck">e-Invoice</Chip>}
          {bill.demo && <DemoTag />}
        </div>
      </Card>

      <Card className="mt-3 divide-y divide-line/70 py-2">
        <Row k="Invoice no." v={bill.invoiceNo} />
        <Row k="Bill date" v={shortDate(bill.billDate)} />
        <Row k="Due date" v={shortDate(bill.dueDate)} />
        <Row k="GSTIN" v={bill.gstin || '—'} />
        <Row k="Kaise aaya (source)" v={bill.source || '—'} />
        <Row k="Payee" v={bill.rail === 'bank' ? `Bank a/c ${bill.bankName || ''} ••${bill.bankLast4 || ''}` : bill.vpa || 'UPI ID nahi (QR scan karein)'} />
      </Card>

      {bill.einv && (
        <Card className="mt-3">
          <div className="flex items-center justify-between gap-2"><b className="text-[14px]">e-Invoice QR data</b><Chip tone="demo">IRP signature: demo</Chip></div>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
            {EINV_FIELDS.map((k) => (<div key={k} className="contents"><dt className="text-grey">{k}</dt><dd className="break-all font-medium">{String(bill.einv[k] ?? '—')}</dd></div>))}
          </dl>
        </Card>
      )}

      <Card className="mt-3">
        <b className="text-[14px]">Timeline</b>
        <ol className="mt-3">
          {timeline.map((e, i) => (
            <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
              {i < timeline.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-28px)] w-0.5 bg-line" />}
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${e.bad ? 'bg-badbg text-bad' : e.ok ? 'bg-okbg text-ok' : e.done ? 'bg-sky text-navy' : 'bg-mist text-grey'}`}>
                <Icon name={e.icon} size={16} strokeWidth={2.1} />
              </span>
              <div className="pt-1"><div className="text-[13.5px] font-medium text-ink">{e.t}</div><div className="text-[12px] text-grey">{e.s}</div></div>
            </li>
          ))}
        </ol>
      </Card>

      {bill.status === 'due' && (
        <Btn variant="danger" icon="flag" className="mt-3 w-full" onClick={() => setSheet(true)}>Galat bill? Distributor ko batayein</Btn>
      )}
      {bill.status === 'disputed' && (
        <Btn variant="soft" className="mt-3 w-full" onClick={() => { updateBill(bill.id, { status: 'due', disputeReason: null }); toast('Dispute hataya') }}>Dispute hatayein (resolved)</Btn>
      )}

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Bill mein kya galat hai?">
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button key={r} onClick={() => setReason(r)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left text-[14px] ring-1 ${reason === r ? 'bg-sky font-semibold text-navy ring-cyan' : 'ring-line'}`}>
              <span className={`h-4 w-4 rounded-full border-2 ${reason === r ? 'border-[5px] border-navy' : 'border-grey/50'}`} />{r}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-grey">Bill pay nahi hoga; distributor ke Chukta Collect mein "Galat bill" dikhega. (Demo: nothing is sent.)</p>
        <Btn variant="navy" className="mt-3 w-full" onClick={dispute}>Distributor ko bhejein</Btn>
      </Sheet>
    </Shell>
  )
}
