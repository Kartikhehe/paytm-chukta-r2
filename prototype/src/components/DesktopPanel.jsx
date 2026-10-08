import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { ABOUT, PROD_URL } from './about.js'

// Shown beside the phone frame on a laptop (≥1024px): what this is, and a QR to open it on a phone.
export default function DesktopPanel() {
  const [qr, setQr] = useState('')
  useEffect(() => {
    import('qrcode').then((m) => m.toDataURL(PROD_URL, { margin: 1, width: 240, color: { dark: '#002E6E', light: '#FFFFFF' } }))
      .then(setQr).catch(() => {})
  }, [])
  return (
    <aside className="hidden max-w-[380px] lg:block">
      <div className="text-[13px] font-semibold uppercase tracking-[.14em] text-cyan2">Paytm Innovation Challenge · Track B</div>
      <h1 className="mt-2 text-[40px] font-extrabold leading-[1.05] tracking-tight text-navy">
        Paytm <span className="text-cyan">Chukta</span>
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-ink2">
        Supplier bills land next to today's collections. The Soundbox reminds at closing time, and the owner pays in one tap with their own Paytm UPI PIN.
      </p>
      <ul className="mt-5 space-y-2.5 text-[14px] text-ink2">
        {[
          ['scan', 'Capture: signed e-invoice QR, else photo / PDF read on the phone'],
          ['shieldCheck', 'Payee check against the GST legal name, 24 h cooling-off'],
          ['speaker', 'Hindi Soundbox reminder, amounts can be muted'],
          ['truck', 'Chukta Collect: the distributor sees invoices matched to payments'],
        ].map(([ic, t]) => (
          <li key={t} className="flex gap-2.5"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-navy shadow-sm"><Icon name={ic} size={16} /></span>{t}</li>
        ))}
      </ul>
      <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-line backdrop-blur">
        {qr ? <img src={qr} alt="QR code to open this prototype on a phone" className="h-28 w-28 rounded-lg" /> : <div className="h-28 w-28 rounded-lg bg-mist" />}
        <div className="text-[13.5px] text-ink2">
          <b className="block text-[15px] text-navy">Open on your phone</b>
          Scan with the camera, or open chukta-r2-prototype.vercel.app. Works best in Chrome on Android.
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[13.5px] font-semibold">
        <Link to="/collect" className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-white hover:bg-navy2"><Icon name="layout" size={16} />Chukta Collect (distributor)</Link>
      </div>
      <p className="mt-5 text-[12px] leading-relaxed text-grey">{ABOUT}</p>
    </aside>
  )
}
