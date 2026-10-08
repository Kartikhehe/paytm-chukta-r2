import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Btn, Card, Chip, DemoTag, Field, Shell, inputCls } from '../components/ui.jsx'
import QrCamera from '../components/QrCamera.jsx'
import { useStore } from '../store.jsx'
import { GST_DEMO } from '../data/demo.js'
import { EINV_FIELDS } from '../lib/einvoice.js'
import { parseUpiQr } from '../lib/upi.js'
import { fromDay, inr, isoDay } from '../lib/fmt.js'

const CORE = ['supplier', 'gstin', 'amount', 'invoiceNo', 'billDate']
const same = (k, a, b) => (k === 'amount' ? Number(a) === Number(b) : k === 'billDate' ? isoDay(a) === isoDay(b) : String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase())
const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

export default function Confirm() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { bills, addBill, logEvent } = useStore()
  const [scanPayee, setScanPayee] = useState(false)
  const [showText, setShowText] = useState(false)
  const [dupOk, setDupOk] = useState(false)

  const init = state?.draft || {}
  const gstName = GST_DEMO[(init.gstin || '').toUpperCase()]
  const plus15 = (iso) => { const d = iso ? new Date(iso) : new Date(); d.setDate(d.getDate() + 15); return d.toISOString() }
  const [f, setF] = useState(() => ({
    supplier: init.supplier || (gstName ? gstName.replace(/\b\w+/g, (w) => w[0] + w.slice(1).toLowerCase()) : ''),
    gstin: init.gstin || '', amount: init.amount ?? '', invoiceNo: init.invoiceNo || '',
    billDate: isoDay(init.billDate) || isoDay(new Date().toISOString()), dueDate: isoDay(plus15(init.billDate)),
    category: '', vpa: init.vpa || '', payeeName: init.payeeName || '', mc: init.mc || '',
  }))
  if (!state) return <Navigate to="/capture" replace />

  const { route, auto = {}, via, ocrText, draft } = state
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const autoKeys = Object.keys(auto).filter((k) => auto[k] !== '' && auto[k] != null)
  const isQr = route === 'e-Invoice QR'
  const tag = (k) => (autoKeys.includes(k)
    ? <Chip tone={isQr ? 'ok' : 'warn'} icon={isQr ? 'shieldCheck' : 'sparkle'} className="ml-1 align-middle">{isQr ? 'QR se' : 'padha · check karein'}</Chip>
    : k === 'supplier' && gstName && isQr ? <Chip className="ml-1 align-middle">GSTIN se (demo)</Chip> : null)

  // Duplicate guard: same invoice no. from the same supplier/GSTIN (e.g. photo + distributor push).
  const dup = f.invoiceNo.trim() && bills.find((b) => norm(b.invoiceNo) === norm(f.invoiceNo)
    && ((f.gstin && norm(b.gstin) === norm(f.gstin)) || norm(b.supplier) === norm(f.supplier)))
  const valid = f.supplier.trim() && Number(f.amount) > 0 && f.invoiceNo.trim() && (!dup || dupOk)

  function onSave() {
    // Score "Fields read correctly?" the way the workbook asks: every machine-read core field kept unchanged?
    let fieldsCorrect = 'n/a'
    if (route !== 'Manual') {
      const read = CORE.filter((k) => autoKeys.includes(k))
      const ok = read.filter((k) => same(k, auto[k], k === 'billDate' ? fromDay(f.billDate) : f[k]))
      const missedCore = ['amount', 'invoiceNo'].some((k) => !autoKeys.includes(k))
      fieldsCorrect = read.length === 0 ? 'No' : ok.length === read.length && !missedCore ? 'Yes' : ok.length === 0 ? 'No' : 'Partly'
    }
    const sample = via === 'demo-sample'
    const id = addBill({
      demo: sample, supplier: f.supplier.trim(), gstin: f.gstin.trim().toUpperCase(), category: f.category,
      amount: Number(f.amount), invoiceNo: f.invoiceNo.trim(), billDate: fromDay(f.billDate), dueDate: fromDay(f.dueDate),
      status: 'due', source: route, einvoice: isQr, einv: draft?.einv, paidCount: 0,
      rail: f.vpa ? 'qr' : 'none', vpa: f.vpa.trim(), payeeName: f.payeeName.trim(), mc: f.mc,
    })
    logEvent('capture', { route, via, sample, fieldsRead: autoKeys.length, fieldsCorrect, billId: id, duplicateOverride: !!dup })
    navigate(`/payee/${id}`, { replace: true })
  }

  return (
    <Shell title="Bill check karein" sub="Confirm before saving" back="/capture" nav={false}
      footer={<Btn variant="navy" size="lg" className="w-full" disabled={!valid} onClick={onSave}>Bill save karein</Btn>}>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-line">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${isQr ? 'bg-okbg text-ok' : 'bg-sky text-navy'}`}>
          <Icon name={isQr ? 'qr' : route === 'Manual' ? 'keyboard' : route === 'Photo' ? 'camera' : 'file'} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{route}{via === 'demo-sample' && <> <DemoTag>demo sample</DemoTag></>}</div>
          <div className="text-[12px] text-grey">{route === 'Manual' ? 'Aap khud bhar rahe hain.' : 'Jo padha gaya woh neeche hai. Galat ho toh badal dein.'}</div>
        </div>
      </div>

      {draft?.einv && (
        <Card className="mt-3 bg-[#F6FEF9] ring-okfill/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="flex items-center gap-1.5 text-[14px] text-ok"><Icon name="shieldCheck" size={17} />e-Invoice QR mila</b>
            <Chip tone="demo">IRP signature check: demo</Chip>
          </div>
          <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
            {EINV_FIELDS.map((k) => (
              <div key={k} className="contents"><dt className="text-grey">{k}</dt><dd className="break-all font-medium">{String(draft.einv[k] ?? '—')}</dd></div>
            ))}
            <dt className="text-grey">iss / alg</dt><dd className="break-all">{draft.einv.iss || '—'} / {draft.einv.alg || '—'}</dd>
          </dl>
          <div className="mt-2 text-[11.5px] text-grey">
            Decoded, not cryptographically verified here. Verify with the official{' '}
            <a className="font-semibold text-navy underline" href="https://einvoice1.gst.gov.in/Others/QRCodeVerifyApp" target="_blank" rel="noreferrer">GST QR verify app</a>.
          </div>
        </Card>
      )}

      {dup && (
        <Card className="mt-3 bg-warnbg ring-warnfill/40">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-warn"><Icon name="alert" size={18} />Yeh bill pehle se hai</div>
          <div className="mt-1 text-[12.5px] text-ink2">{dup.supplier} · Inv #{dup.invoiceNo} · {inr(dup.amount)} ({dup.status === 'paid' ? 'chukta' : 'baaki'}). Duplicate bill dobara pay na ho.</div>
          <div className="mt-2.5 flex gap-2">
            <Btn size="sm" variant="navy" onClick={() => navigate(`/bill/${dup.id}`, { replace: true })}>Purana bill kholein</Btn>
            <Btn size="sm" variant="soft" onClick={() => setDupOk(true)} disabled={dupOk}>{dupOk ? 'OK, alag bill hai' : 'Alag bill hai, save'}</Btn>
          </div>
        </Card>
      )}

      <Card className="mt-3 space-y-3.5">
        <Field hi={<>Supplier ka naam{tag('supplier')}</>} en="as on the bill">
          <input className={inputCls} value={f.supplier} onChange={set('supplier')} placeholder="e.g. Sharma Traders" />
        </Field>
        <Field hi={<>GSTIN{tag('gstin')}</>} en="optional">
          <input className={inputCls + ' uppercase'} value={f.gstin} onChange={set('gstin')} maxLength={15} placeholder="09XXXXX0000X1Z5" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field hi={<>Rakam ₹{tag('amount')}</>} en="amount">
            <input className={inputCls} inputMode="decimal" value={f.amount} onChange={set('amount')} />
          </Field>
          <Field hi={<>Bill no.{tag('invoiceNo')}</>} en="invoice">
            <input className={inputCls} value={f.invoiceNo} onChange={set('invoiceNo')} />
          </Field>
          <Field hi={<>Bill date{tag('billDate')}</>}>
            <input type="date" className={inputCls} value={f.billDate} onChange={set('billDate')} />
          </Field>
          <Field hi="Kab dena hai" en="due">
            <input type="date" className={inputCls} value={f.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
      </Card>

      <Card className="mt-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink"><Icon name="wallet" size={18} className="text-navy" />Payment kahan jayega <span className="font-normal text-grey">(payee)</span></div>
        {scanPayee ? (
          <div className="mt-3">
            <QrCamera hint="Supplier ka UPI / Paytm QR" onResult={(t) => {
              const u = parseUpiQr(t)
              if (u) setF((x) => ({ ...x, vpa: u.vpa, payeeName: u.payeeName, mc: u.mc }))
              setScanPayee(false)
            }} />
            <Btn variant="soft" className="mt-2 w-full" onClick={() => setScanPayee(false)}>Band karein</Btn>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <Btn variant="ghost" icon="scan" className="w-full" onClick={() => setScanPayee(true)}>Supplier ka QR scan karein</Btn>
            <Field hi="UPI ID" en="optional">
              <input className={inputCls} value={f.vpa} onChange={set('vpa')} placeholder="name@bank" autoCapitalize="none" />
            </Field>
            {f.payeeName && <div className="text-[12px] text-grey">QR par naam: <b className="text-ink">{f.payeeName}</b></div>}
          </div>
        )}
      </Card>

      {ocrText && (
        <div className="mt-3 text-[12px]">
          <button className="font-medium text-grey underline" onClick={() => setShowText((s) => !s)}>{showText ? 'Padha hua text chhupayein' : 'Padha hua text dekhein (raw OCR)'}</button>
          {showText && <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-[11px] ring-1 ring-line">{ocrText}</pre>}
        </div>
      )}
    </Shell>
  )
}
