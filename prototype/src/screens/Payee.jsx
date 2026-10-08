import { useEffect, useRef } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Avatar, Btn, Card, DemoTag, Shell } from '../components/ui.jsx'
import { balance, useStore } from '../store.jsx'
import { payeeCheck } from '../lib/names.js'
import { inr } from '../lib/fmt.js'

const RESULT = {
  match: { icon: 'shieldCheck', ring: 'bg-okbg text-ok', title: 'Naam match', en: 'Name on bill matches the GST legal name', box: 'bg-okbg ring-okfill/30 text-ok' },
  mismatch: { icon: 'alert', ring: 'bg-badbg text-bad', title: 'Naam match nahi', en: 'Names differ: confirm with the supplier before paying', box: 'bg-badbg ring-badfill/30 text-bad' },
  unknown: { icon: 'info', ring: 'bg-warnbg text-warn', title: 'GST naam nahi mila', en: 'Not in the demo lookup: check the payee name in your Paytm app before the PIN', box: 'bg-warnbg ring-warnfill/30 text-warn' },
}

export default function Payee() {
  const { id } = useParams()
  const { bills, logEvent } = useStore()
  const navigate = useNavigate()
  const bill = bills.find((b) => b.id === id)
  const logged = useRef(false)

  const check = bill ? payeeCheck(bill.supplier, bill.gstin) : null
  const isNew = bill && !bill.paidCount
  const changed = bill?.payeeChanged
  const cooling = isNew || changed

  useEffect(() => {
    if (bill && !logged.current) {
      logged.current = true
      logEvent('payee_check', { billId: bill.id, demoBill: !!bill.demo, result: check.status, newPayee: !!isNew, changedPayee: !!changed })
    }
  }, [bill, check, isNew, changed, logEvent])

  if (!bill) return <Navigate to="/" replace />
  const r = RESULT[check.status]
  const until = new Date(Date.now() + 24 * 3600 * 1000).toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit' })

  return (
    <Shell title="Payee check" sub={`${bill.supplier} · ${inr(balance(bill))}`} back={-1} nav={false}
      footer={
        <div className="space-y-2">
          <Btn size="lg" className="w-full" onClick={() => navigate(`/pay/${bill.id}`)}>
            {cooling ? 'Aage badhein (field test)' : 'Aage: Chukta karein'}
          </Btn>
          {cooling && <div className="text-center text-[11.5px] text-grey">Prototype skips the 24 h hold so the owner can pay a bill that is due today.</div>}
        </div>
      }>
      <div className="flex flex-col items-center pt-2 text-center">
        <span className={`grid h-16 w-16 animate-pop place-items-center rounded-full ${r.ring}`}><Icon name={r.icon} size={32} strokeWidth={2} /></span>
        <div className="mt-3 text-[20px] font-bold text-ink">{r.title}</div>
        <div className="mt-1 max-w-[300px] text-[13px] text-grey">{r.en}</div>
      </div>

      <Card className="mt-5 p-0">
        <div className="flex items-center gap-3 p-4">
          <Avatar name={bill.supplier} size={40} />
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium uppercase tracking-wide text-grey">Bill par naam</div>
            <div className="truncate text-[16px] font-semibold">{bill.supplier}</div>
          </div>
        </div>
        <div className="relative flex items-center px-4">
          <span className="ml-[19px] h-6 w-0.5 bg-line" />
          <span className={`absolute left-[26px] grid h-7 w-7 place-items-center rounded-full ring-4 ring-white ${r.ring}`}>
            <Icon name={check.status === 'match' ? 'check' : check.status === 'mismatch' ? 'x' : 'info'} size={15} strokeWidth={2.6} />
          </span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist text-navy"><Icon name="file" size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-wide text-grey">GST legal name <DemoTag>demo lookup</DemoTag></div>
            <div className="truncate text-[16px] font-semibold">{check.legal || '—'}</div>
            <div className="text-[12px] text-grey">GSTIN {bill.gstin || 'bill par nahi'}</div>
          </div>
        </div>
      </Card>

      {check.status === 'mismatch' && (
        <Card className={`mt-3 text-[13px] ${r.box}`}>
          Bill par "{bill.supplier}", GST mein "{check.legal}". Supplier se poochh lein ki payment kis naam par jaana chahiye.
        </Card>
      )}
      {check.status === 'unknown' && (
        <Card className={`mt-3 text-[13px] ${r.box}`}>
          {bill.gstin ? 'Yeh GSTIN demo table mein nahi hai.' : 'Bill par GSTIN nahi hai.'} Asli app GST portal se naam laayega. Abhi: Paytm mein PIN se pehle payee ka naam dhyan se dekhein.
        </Card>
      )}

      {cooling && (
        <Card className="mt-3 flex gap-3 bg-warnbg ring-warnfill/30">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-warn"><Icon name="clock" size={20} /></span>
          <div className="text-[13px] text-ink2">
            <b className="text-warn">{changed ? 'Payee badla hai' : 'Naya payee'}: 24 ghante cooling-off</b>
            <div className="mt-0.5">{changed ? 'Is supplier ka bank account / UPI ID badla hai.' : 'Is supplier ko pehle kabhi payment nahi hua.'} Real app mein pehli payment {until} ke baad, jab tak supplier dobara verify na ho.</div>
          </div>
        </Card>
      )}
      {!cooling && (
        <Card className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-okbg text-ok"><Icon name="history" size={20} /></span>
          <div className="text-[13px] text-ink2"><b className="text-ink">Purana supplier</b> · {bill.paidCount} bills paid in 6 months, same payee</div>
        </Card>
      )}
    </Shell>
  )
}
