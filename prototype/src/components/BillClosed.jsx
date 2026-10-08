import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { Avatar, Btn, Card, Shell } from './ui.jsx'
import { inr, shortDate } from '../lib/fmt.js'

/** Shown instead of Pay / Payee check / 7 din baad when a bill is already paid or disputed. */
export default function BillClosed({ bill }) {
  const navigate = useNavigate()
  const paid = bill.status === 'paid'
  return (
    <Shell title={paid ? 'Bill chukta hai' : 'Galat bill'} sub={bill.supplier} back="/" nav={false}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="navy" onClick={() => navigate(`/bill/${bill.id}`, { replace: true })}>Bill dekhein</Btn>
          <Btn variant="outline" onClick={() => navigate('/', { replace: true })}>Bills par wapas</Btn>
        </div>
      }>
      <div className="flex flex-col items-center pt-6 text-center">
        <span className={`grid h-16 w-16 animate-pop place-items-center rounded-full ${paid ? 'bg-okbg text-ok' : 'bg-badbg text-bad'}`}>
          <Icon name={paid ? 'checkCircle' : 'flag'} size={32} strokeWidth={2} />
        </span>
        <div className="mt-3 text-[20px] font-bold text-ink">{paid ? 'Yeh bill pehle hi chukta ho chuka hai' : 'Yeh bill "galat" mark hai'}</div>
        <div className="mt-1 max-w-[300px] text-[13px] text-grey">
          {paid ? `Paid ${shortDate(bill.paidAt)}. Dobara payment ki zaroorat nahi. (Already paid: nothing to pay.)`
            : `Payment roka gaya hai jab tak distributor bill theek na kare. (${bill.disputeReason || 'Disputed'}: payment is on hold.)`}
        </div>
      </div>
      <Card className="mt-5 flex items-center gap-3">
        <Avatar name={bill.supplier} size={40} />
        <div className="min-w-0 flex-1"><div className="truncate text-[15px] font-semibold">{bill.supplier}</div><div className="text-[12px] text-grey">Inv #{bill.invoiceNo}</div></div>
        <div className="text-[16px] font-bold">{inr(bill.amount)}</div>
      </Card>
    </Shell>
  )
}
