import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { Avatar, Btn, Card, Chip, DemoTag } from './ui.jsx'
import { balance, paidSoFar } from '../store.jsx'
import { dueLabel, inr } from '../lib/fmt.js'

const SRC_ICON = { 'e-Invoice QR': 'qr', Photo: 'camera', 'PDF / WhatsApp': 'file', Manual: 'keyboard', 'Distributor push': 'truck' }

export function DueChip({ iso }) {
  const d = dueLabel(iso)
  const tone = { bad: 'bad', warn: 'warn', calm: 'grey' }[d.tone]
  return <Chip tone={tone} icon="clock">{d.hi}</Chip>
}

export default function BillCard({ bill }) {
  const navigate = useNavigate()
  const part = paidSoFar(bill) > 0
  const disputed = bill.status === 'disputed'
  return (
    <Card className="p-0">
      <button onClick={() => navigate(`/bill/${bill.id}`)} className="flex w-full items-start gap-3 p-4 pb-3 text-left">
        <Avatar name={bill.supplier} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate text-[15.5px] font-semibold text-ink">{bill.supplier}</div>
            <div className="shrink-0 text-[17px] font-bold text-ink">{inr(balance(bill))}</div>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[12.5px] text-grey">
            <Icon name={SRC_ICON[bill.source] || 'receipt'} size={13} />
            <span className="truncate">Inv #{bill.invoiceNo}{bill.category ? ` · ${bill.category}` : ''}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {disputed ? <Chip tone="bad" icon="flag">Galat bill · distributor ko bheja</Chip> : <DueChip iso={bill.dueDate} />}
            {bill.einvoice && <Chip tone="ok" icon="shieldCheck">e-Invoice</Chip>}
            {part && <Chip tone="sky">{inr(paidSoFar(bill))} diya</Chip>}
            {bill.demo && <DemoTag />}
          </div>
        </div>
      </button>
      {!disputed && (
        <div className="grid grid-cols-2 gap-2 border-t border-line/70 px-4 py-3">
          <Btn size="sm" className="min-h-10 text-[14px]" onClick={() => navigate(`/payee/${bill.id}`)}>Chukta karein</Btn>
          <Btn size="sm" variant="outline" className="min-h-10 text-[14px]" onClick={() => navigate(`/later/${bill.id}`)}>7 din baad</Btn>
        </div>
      )}
    </Card>
  )
}
