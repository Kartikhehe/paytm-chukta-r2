import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Bi, Btn, Card, Chip, Shell } from '../components/ui.jsx'
import QrCamera from '../components/QrCamera.jsx'
import { decodeEinvoice, demoEinvoiceJwt, parseDocDt } from '../lib/einvoice.js'
import { parseUpiQr } from '../lib/upi.js'
import { extractFields, fileToCanvas, runOcr, scanQrInCanvas } from '../lib/ocr.js'

// Turn a decoded e-invoice into a bill draft. `auto` remembers what the machine read, to score "fields read correctly".
function draftFromEinvoice(ei) {
  const f = ei.fields
  const auto = {
    gstin: f.SellerGstin || '', amount: f.TotInvVal != null ? Number(f.TotInvVal) : '',
    invoiceNo: f.DocNo || '', billDate: parseDocDt(f.DocDt) || '',
  }
  return { auto, draft: { ...auto, supplier: '', einvoice: true, einv: { ...f, iss: ei.iss, alg: ei.header?.alg } } }
}

export default function Capture() {
  const navigate = useNavigate()
  const [mode, setMode] = useState(null) // 'camera' | 'busy'
  const [payee, setPayee] = useState(null) // supplier UPI QR, if scanned
  const [note, setNote] = useState('')
  const [progress, setProgress] = useState(null)
  const photoInput = useRef(null)
  const fileInput = useRef(null)

  const go = (route, { draft = {}, auto = {} } = {}, extra = {}) => {
    const withPayee = payee ? { ...draft, vpa: payee.vpa, payeeName: payee.payeeName, mc: payee.mc } : draft
    navigate('/confirm', { state: { route, draft: withPayee, auto, ...extra } })
  }

  const onQrText = useCallback((text, source = 'camera') => {
    const ei = decodeEinvoice(text)
    if (ei) {
      go('e-Invoice QR', draftFromEinvoice(ei), { via: source })
      return true
    }
    const upi = parseUpiQr(text)
    if (upi) {
      setPayee(upi)
      setMode(null)
      setNote('')
      return true
    }
    setMode(null)
    setNote(`QR mila par yeh e-invoice ya UPI QR nahi hai: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`)
    return false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payee])

  async function onFile(e, kind) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    const route = isPdf ? 'PDF / WhatsApp' : 'Photo'
    setMode('busy')
    setNote('')
    setProgress({ status: 'Bill khol rahe hain…', p: 0 })
    try {
      const canvas = await fileToCanvas(file)
      setProgress({ status: 'QR dhoondh rahe hain…', p: 0.05 })
      const qr = scanQrInCanvas(canvas)
      if (qr && decodeEinvoice(qr)) {
        go('e-Invoice QR', draftFromEinvoice(decodeEinvoice(qr)), { via: kind })
        return
      }
      const text = await runOcr(canvas, (m) => {
        if (m.status === 'recognizing text') setProgress({ status: 'Bill padh rahe hain…', p: m.progress })
        else setProgress({ status: m.status === 'loading language traineddata' ? 'Hindi + English model load ho raha hai (pehli baar ~1 min)…' : 'Taiyaari…', p: m.progress || 0 })
      })
      const auto = extractFields(text)
      go(route, { draft: { ...auto }, auto }, { ocrText: text, via: kind })
    } catch (err) {
      setMode(null)
      setProgress(null)
      setNote('Bill padh nahi paaye: ' + (err?.message || err) + '. Manual bharein.')
    }
  }

  const tile = 'flex flex-col items-start gap-2 rounded-2xl bg-white p-4 text-left text-navy shadow-[var(--shadow-card)] ring-1 ring-line/70 active:bg-sky'
  return (
    <Shell title="Bill jodein" sub="Add a supplier bill" back="/">
      {payee && (
        <Card className="mb-3 bg-sky ring-cyan/40">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-navy"><Icon name="checkCircle" size={18} className="text-ok" />Supplier ka UPI QR mila <span className="font-normal text-grey">(payee saved)</span></div>
          <div className="mt-1 break-all text-[13px]"><b>{payee.payeeName || '—'}</b> · {payee.vpa}</div>
          <div className="mt-1 text-[12px] text-grey">Ab is supplier ka bill jodein: photo, e-invoice ya manual.</div>
        </Card>
      )}

      {mode === 'camera' ? (
        <div>
          <QrCamera onResult={(t) => onQrText(t, 'camera')} hint="e-Invoice QR ya supplier ka UPI QR" />
          <Btn variant="soft" icon="x" className="mt-3 w-full" onClick={() => setMode(null)}>Band karein (close camera)</Btn>
        </div>
      ) : mode === 'busy' ? (
        <Card className="py-8 text-center">
          <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky text-navy ring-pulse"><Icon name="sparkle" size={28} /></div>
          <div className="mt-4 text-[16px] font-semibold text-ink">{progress?.status}</div>
          <div className="mx-auto mt-4 h-2 max-w-[260px] overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${Math.max(4, Math.round((progress?.p || 0) * 100))}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-grey"><Icon name="lock" size={13} />Bill phone par hi padha jaata hai; upload nahi hota.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setMode('camera')}
            className="relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#002E6E,#0A3D86)] p-5 text-left text-white shadow-[var(--shadow-lift)] active:opacity-95">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cyan text-navy"><Icon name="qr" size={34} strokeWidth={2} /></span>
            <span className="min-w-0">
              <span className="block text-[18px] font-bold">QR scan karein</span>
              <span className="mt-0.5 block text-[12.5px] text-white/75">e-invoice signed QR: sab kuch apne aap bhar jaata hai</span>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold"><Icon name="zap" size={12} />Sabse tez · best</span>
            </span>
            <span className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-cyan/20" />
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => photoInput.current?.click()} className={tile}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky"><Icon name="camera" size={22} /></span>
              <Bi hi="Bill ki photo" en="paper challan" className="text-[15px] font-semibold" />
            </button>
            <button onClick={() => fileInput.current?.click()} className={tile}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky"><Icon name="file" size={22} /></span>
              <Bi hi="Gallery / PDF" en="WhatsApp bill" className="text-[15px] font-semibold" />
            </button>
          </div>
          <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e, 'photo')} />
          <input ref={fileInput} type="file" accept="image/*,application/pdf" hidden onChange={(e) => onFile(e, 'file')} />
          <button onClick={() => go('Manual')} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left text-navy ring-1 ring-line">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mist"><Icon name="keyboard" size={20} /></span>
            <Bi hi="Khud bharein" en="manual entry (last resort)" className="flex-1 text-[15px] font-semibold" />
            <Icon name="chevron" size={18} className="text-grey" />
          </button>

          {note && <Card className="bg-warnbg text-[13px] text-warn ring-warnfill/30">{note}</Card>}

          <div className="rounded-2xl bg-mist p-3.5 text-[12.5px] text-ink2">
            <div className="flex items-center gap-1.5 font-semibold text-navy"><Icon name="info" size={15} />Kram (order)</div>
            <ol className="mt-1.5 space-y-1 pl-5 [list-style:decimal]">
              <li>Signed e-invoice QR (no typing)</li>
              <li>Photo / PDF padhna: aap check karte hain</li>
              <li>Manual: aakhri raasta</li>
            </ol>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
              <Chip tone="demo">demo</Chip>
              <button className="font-semibold text-navy underline" onClick={() => onQrText(demoEinvoiceJwt(), 'demo-sample')}>
                Sample e-invoice QR try karein
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}
