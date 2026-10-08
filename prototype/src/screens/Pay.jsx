import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import BillClosed from '../components/BillClosed.jsx'
import { DueChip } from '../components/BillCard.jsx'
import { Avatar, Btn, Card, Chip, DemoTag, Field, Shell, inputCls, toast } from '../components/ui.jsx'
import { balance, paidSoFar, useStore } from '../store.jsx'
import { PAY_FROM } from '../data/demo.js'
import { buildIntent, isVpa } from '../lib/upi.js'
import { payeeCheck } from '../lib/names.js'
import { copyText } from '../lib/csv.js'
import { inr, timeOf } from '../lib/fmt.js'

const HOW = [['qr', 'Paytm mein QR scan'], ['intent', 'Link se (UPI intent)'], ['bank', 'Paytm bank transfer']]

function Receipt({ bill, done, onDone }) {
  const tn = `INV-${bill.invoiceNo}`
  const ok = done.l3 === 'Yes'
  const share = async () => {
    const text = `Chukta: ${inr(done.amount)} to ${bill.supplier} for ${tn} (owner-confirmed, paid in Paytm) · ${new Date(done.at).toLocaleString('en-IN')}`
    try { if (navigator.share) await navigator.share({ text }); else if (await copyText(text)) toast('Proof text copied') } catch { /* user cancelled */ }
  }
  return (
    <Shell title="" back="/" nav={false} footer={<Btn variant="navy" size="lg" className="w-full" onClick={onDone}>Bills par wapas</Btn>}>
      <div className="flex flex-col items-center pt-6 text-center">
        <span className={`relative grid h-20 w-20 animate-pop place-items-center rounded-full ${ok ? 'bg-okfill text-white' : 'bg-mist text-navy'}`}>
          <Icon name={ok ? 'check' : done.l3 === 'No' ? 'x' : 'receipt'} size={42} strokeWidth={2.6} />
        </span>
        <div className="mt-4 text-[15px] font-medium text-grey">
          {ok ? (done.full ? 'Chukta! Owner ne confirm kiya' : 'Part payment noted') : done.l3 === 'No' ? 'Theek hai, koi baat nahi' : 'Noted: pehle hi diya'}
        </div>
        {ok && <div className="mt-1 text-[40px] font-bold tracking-tight text-ink">{inr(done.amount)}</div>}
        <div className="mt-1 text-[14px] text-ink2">{ok ? `to ${bill.supplier}` : bill.supplier}</div>
      </div>
      {ok && (
        <Card className="mt-6 p-0">
          <div className="divide-y divide-line/70 px-4">
            {[['Invoice', tn], ['Kaise', HOW.find((h) => h[0] === done.how)?.[1]], ['Samay', timeOf(done.at)], ['Baaki', done.full ? 'Kuch nahi · bill closed' : inr(balance(bill))]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 text-[13.5px]"><span className="text-grey">{k}</span><span className="font-semibold">{v}</span></div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-b-2xl bg-okbg px-4 py-2.5 text-[12.5px] font-medium text-ok">
            <Icon name="shieldCheck" size={16} />Proof saved with invoice no. (owner-confirmed)
          </div>
        </Card>
      )}
      {ok && <Btn variant="soft" icon="share" className="mt-3 w-full" onClick={share}>Proof share karein</Btn>}
      <p className="mt-4 text-center text-[12px] text-grey">Paisa Paytm ne bheja, aapke PIN se. Prototype ne sirf note kiya hai.</p>
    </Shell>
  )
}

export default function Pay() {
  const { id } = useParams()
  const { bills, updateBill, recordPayment, logEvent } = useStore()
  const navigate = useNavigate()
  const bill = bills.find((b) => b.id === id)
  const [vpa, setVpa] = useState(bill?.vpa || '')
  const [opened, setOpened] = useState(false)
  const [how, setHow] = useState('qr')
  const [mode, setMode] = useState('full')
  const [part, setPart] = useState('')
  const [done, setDone] = useState(null)

  if (!bill) return <Navigate to="/" replace />
  if (bill.status !== 'due' && !done) return <BillClosed bill={bill} />
  if (done) return <Receipt bill={bills.find((b) => b.id === id)} done={done} onDone={() => navigate('/')} />

  const due = balance(bill)
  const amount = mode === 'full' ? due : Math.min(due, Number(part) || 0)
  const intent = isVpa(vpa) && amount > 0 ? buildIntent({ vpa, name: bill.payeeName || bill.supplier, amount, invoiceNo: bill.invoiceNo, mc: bill.mc }) : null
  const tn = `INV-${bill.invoiceNo}`
  const gst = payeeCheck(bill.supplier, bill.gstin)

  const openIntent = () => {
    if (!intent) return
    if (vpa !== bill.vpa) updateBill(bill.id, { vpa })
    logEvent('pay_intent_opened', { billId: bill.id, demoBill: !!bill.demo, partial: mode === 'part' })
    setOpened(true)
    setHow('intent')
    // If no UPI app takes the link (laptop, or a phone without one), the page stays visible: say so.
    let left = false
    const onHide = () => { if (document.hidden) left = true }
    document.addEventListener('visibilitychange', onHide)
    window.location.href = intent // Android shows the UPI app chooser; the owner picks Paytm and enters their own PIN
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide)
      if (!left && !document.hidden) toast('UPI app nahi khula. Phone par kholein, ya neeche "QR scan" wala tareeka use karein.')
    }, 1800)
  }
  const copy = async (label, text) => { if (await copyText(text)) toast(`${label} copied`) }

  const outcome = (l3) => {
    const at = new Date().toISOString()
    logEvent('L3', { billId: bill.id, demoBill: !!bill.demo, l3, how: l3 === 'Yes' ? how : null, intentOpened: opened, amount: l3 === 'Yes' ? amount : null, partial: mode === 'part' })
    let full = false
    if (l3 === 'Yes') full = recordPayment(bill.id, { amount, how })
    if (l3 === 'Already paid') { updateBill(bill.id, { status: 'paid', paidAt: at }); full = true }
    setDone({ l3, at, amount, how, full })
  }

  return (
    <Shell title="Chukta karein" sub={`${bill.supplier} · Inv #${bill.invoiceNo}`} back={-1} nav={false}
      footer={
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Btn size="lg" disabled={!intent} onClick={openIntent}>Abhi chukta {amount > 0 ? inr(amount) : ''}</Btn>
          <Btn size="lg" variant="outline" onClick={() => navigate(`/later/${bill.id}`)}>7 din baad</Btn>
        </div>
      }>
      <Card className="text-center">
        <div className="flex justify-center"><Avatar name={bill.supplier} size={52} /></div>
        <div className="mt-2 text-[16px] font-semibold">{bill.supplier}</div>
        <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1.5 text-[12px] text-grey">
          <DueChip iso={bill.dueDate} />{bill.paidCount > 0 && <Chip tone="ok" icon="history">{bill.paidCount} bills paid</Chip>}{bill.demo && <DemoTag />}
        </div>
        <div className="mt-3 text-[40px] font-bold leading-none tracking-tight text-ink">{inr(amount)}</div>
        {paidSoFar(bill) > 0 && <div className="mt-1 text-[12px] text-grey">{inr(paidSoFar(bill))} pehle diya · {inr(due)} baaki</div>}
        <div className="mx-auto mt-3 grid max-w-[260px] grid-cols-2 gap-1 rounded-xl bg-mist p-1 text-[13px] font-semibold">
          {[['full', 'Poora'], ['part', 'Kuch hissa']].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`rounded-lg py-1.5 ${mode === k ? 'bg-white text-navy shadow-sm' : 'text-grey'}`}>{l}</button>
          ))}
        </div>
        {mode === 'part' && (
          <input className={inputCls + ' mx-auto mt-2 max-w-[200px] text-center text-[18px] font-semibold'} inputMode="decimal" autoFocus
            placeholder={`max ${due}`} value={part} onChange={(e) => setPart(e.target.value.replace(/[^\d.]/g, ''))} />
        )}
        <div className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold ${gst.status === 'match' ? 'bg-okbg text-ok' : gst.status === 'mismatch' ? 'bg-badbg text-bad' : 'bg-warnbg text-warn'}`}>
          <Icon name={gst.status === 'match' ? 'shieldCheck' : 'alert'} size={16} />
          {gst.status === 'match' ? 'Payee name matched to GST legal name' : gst.status === 'mismatch' ? 'Payee name does not match GST legal name' : 'GST name not found: check name in Paytm'}
          <DemoTag>demo lookup</DemoTag>
        </div>
      </Card>

      <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-[#FFF1F0] p-3 text-[12.5px] leading-snug text-bad ring-1 ring-badfill/25">
        <Icon name="lock" size={20} className="shrink-0" />
        <div><b>Yeh prototype paise nahi bhejta.</b> Payment sirf aapke Paytm app mein, aapke UPI PIN se. <span className="opacity-80">This prototype never moves money.</span></div>
      </div>

      <div className="mb-1.5 mt-4 px-0.5 text-[13px] font-semibold text-ink2">Supplier ne chuna <span className="font-normal text-grey">(supplier's choice)</span></div>
      <Card className="space-y-0 p-0">
        {bill.rail === 'bank' && (
          <div className="flex items-center gap-3 p-3.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky text-navy"><Icon name="bank" size={20} /></span>
            <div className="min-w-0 flex-1"><div className="text-[14.5px] font-semibold">Bank account · {bill.bankName} ••{bill.bankLast4}</div><div className="text-[12px] text-grey">UPI to a/c · invoice no. attached · no MDR</div></div>
            <Icon name="checkCircle" size={20} className="text-cyan2" />
          </div>
        )}
        <div className={`flex items-center gap-3 p-3.5 ${bill.rail === 'bank' ? 'border-t border-line/70' : ''}`}>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky text-navy"><Icon name="qr" size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-semibold">{bill.rail === 'bank' ? 'UPI handle for this payee' : 'UPI ID / QR'}</div>
            {bill.vpa ? <div className="truncate text-[12px] text-grey">{bill.vpa}{bill.payeeName ? ` · ${bill.payeeName}` : ''}</div> : <div className="text-[12px] text-grey">UPI ID nahi mila</div>}
          </div>
          {bill.rail !== 'bank' && <Icon name="checkCircle" size={20} className="text-cyan2" />}
        </div>
        {!bill.vpa && (
          <div className="border-t border-line/70 p-3.5">
            <Field hi="Supplier ka UPI ID" en="from their QR or bill" hint="Ya neeche: Paytm mein QR scan karein">
              <input className={inputCls} value={vpa} onChange={(e) => setVpa(e.target.value)} placeholder="name@bank" autoCapitalize="none" />
            </Field>
          </div>
        )}
      </Card>
      {bill.demo && <div className="mt-1.5 px-0.5 text-[11.5px] text-grey">Demo payee ka UPI ID jaan-boojh kar <b>@invalid</b> hai: paisa kahin nahi ja sakta.</div>}

      <div className="mb-1.5 mt-4 px-0.5 text-[13px] font-semibold text-ink2">Kahan se? <span className="font-normal text-grey">(pay from)</span></div>
      <Card className="flex items-center gap-3 p-3.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-mist text-navy"><Icon name="bank" size={20} /></span>
        <div className="min-w-0 flex-1"><div className="text-[14.5px] font-semibold">{PAY_FROM.bank} ••{PAY_FROM.last4}</div><div className="text-[12px] text-grey">{PAY_FROM.note} · Paytm app mein chunte hain</div></div>
        <DemoTag />
      </Card>
      {intent && <div className="mt-2 break-all px-0.5 font-mono text-[10.5px] text-grey">{intent}</div>}

      <Card className="mt-4 bg-warnbg ring-warnfill/30">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-warn"><Icon name="alert" size={18} />Link se payment nahi hua?</div>
        <p className="mt-1 text-[12.5px] text-ink2">
          NPCI rule: UPI apps <b>personal UPI ID</b> ya <b>chhote (non-verified) merchant QR</b> ko link se payment nahi karne dete. Toh:
        </p>
        <ol className="mt-2 space-y-1.5 text-[13px] text-ink">
          {[<>Paytm kholein, <b>supplier ka QR scan</b> karein</>, <>Rakam <b>{inr(amount)}</b> daalein</>, <>Note mein likhein: <b>{tn}</b></>].map((t, i) => (
            <li key={i} className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-warn">{i + 1}</span><span>{t}</span></li>
          ))}
        </ol>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Btn size="sm" variant="soft" icon="copy" onClick={() => copy(tn, tn)}>{tn}</Btn>
          <Btn size="sm" variant="soft" icon="copy" onClick={() => copy('Rakam', String(amount))}>Rakam</Btn>
        </div>
      </Card>

      <Card className="mt-3">
        <div className="text-[14.5px] font-semibold text-ink">Payment hua? <span className="font-normal text-grey">(owner confirms · L3)</span></div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HOW.map(([k, label]) => (
            <button key={k} onClick={() => setHow(k)}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${how === k ? 'bg-navy text-white' : 'bg-mist text-ink2'}`}>{label}</button>
          ))}
        </div>
        <Btn variant="ok" icon="checkCircle" className="mt-3 w-full text-[14px]" disabled={!(amount > 0)} onClick={() => outcome('Yes')}>Paid via Paytm (owner confirmed)</Btn>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Btn variant="soft" size="sm" className="min-h-10" onClick={() => outcome('No')}>Nahi kiya (No)</Btn>
          <Btn variant="soft" size="sm" className="min-h-10" onClick={() => outcome('Already paid')}>Pehle hi de diya</Btn>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-grey"><Icon name="pen" size={13} />Yeh jawab field log mein jaata hai (L3).</div>
      </Card>
    </Shell>
  )
}
