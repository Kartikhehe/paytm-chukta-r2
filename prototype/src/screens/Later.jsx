import { useEffect, useRef } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BillClosed from '../components/BillClosed.jsx'
import { Avatar, Btn, Card, Chip, DemoTag, Shell, useBack } from '../components/ui.jsx'
import { balance, useStore } from '../store.jsx'
import { inr } from '../lib/fmt.js'

export default function Later() {
  const { id } = useParams()
  const { bills, logEvent } = useStore()
  const goBack = useBack()
  const bill = bills.find((b) => b.id === id)
  const logged = useRef(false)
  useEffect(() => {
    if (bill && bill.status === 'due' && !logged.current) { logged.current = true; logEvent('later_opened', { billId: bill.id, demoBill: !!bill.demo }) }
  }, [bill, logEvent])
  if (!bill) return <Navigate to="/" replace />
  if (bill.status !== 'due') return <BillClosed bill={bill} />

  const qrPayee = bill.rail !== 'bank'
  const due = new Date(); due.setDate(due.getDate() + 7)
  const steps = [
    ['bank', 'Partner bank ki credit line, UPI par', 'A small credit line on UPI from a partner bank, not from Paytm'],
    ['zap', 'Supplier ko aaj hi poora paisa', 'The supplier is paid in full today, so the distributor sees no delay'],
    ['calendar', `Aap 7 din baad chukta karein · ${due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`, 'You repay the bank in 7 days; any fee is shown before you agree'],
    ['qr', 'Sirf merchant-QR wale supplier', 'Only for suppliers paid on a merchant QR, not to a personal or bank account'],
  ]

  return (
    <Shell title="7 din baad" sub="Pay later · explainer only" back={-1} nav={false}
      footer={<Btn variant="navy" size="lg" className="w-full" onClick={goBack}>Samajh gaya (got it)</Btn>}>
      <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#002E6E,#0A3D86)] p-5 text-white">
        <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-cyan/20" />
        <div className="flex items-center gap-3">
          <Avatar name={bill.supplier} size={40} />
          <div className="min-w-0 flex-1"><div className="truncate text-[14px] font-semibold">{bill.supplier}</div><div className="text-[12px] text-white/70">Inv #{bill.invoiceNo}</div></div>
          <DemoTag>demo · no credit</DemoTag>
        </div>
        <div className="mt-4 text-[12.5px] text-white/75">Supplier ko aaj</div>
        <div className="text-[34px] font-bold leading-tight tracking-tight">{inr(balance(bill))}</div>
        <div className="mt-1 text-[12.5px] text-white/75">Aap {due.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} tak chukta karein</div>
        {!qrPayee && <div className="mt-3"><Chip tone="warn" icon="alert">Is supplier ke liye nahi: bank a/c payee</Chip></div>}
      </div>

      <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-warnbg p-3 text-[12.5px] text-warn ring-1 ring-warnfill/30">
        <Icon name="info" size={18} className="shrink-0" />
        <div><b>Sirf samjhaane ke liye.</b> Is prototype mein koi credit nahi milta. <span className="opacity-80">Explainer only; no credit is offered or recorded.</span></div>
      </div>

      <Card className="mt-3 p-0">
        {steps.map(([ic, hi, en], i) => (
          <div key={hi} className={`flex gap-3 p-4 ${i ? 'border-t border-line/70' : ''}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky text-navy"><Icon name={ic} size={20} /></span>
            <div><div className="text-[14.5px] font-semibold text-ink">{hi}</div><div className="mt-0.5 text-[12.5px] text-grey">{en}</div></div>
          </div>
        ))}
      </Card>

      <div className="mt-3 rounded-2xl bg-mist p-3.5 text-[12.5px] text-ink2">
        <b className="text-navy">Field task T4:</b> <i>"7 din baad" dabaiye. Iska matlab kya hai?</i> Owner ko apne shabdon mein samjhaane dein.
      </div>
    </Shell>
  )
}
