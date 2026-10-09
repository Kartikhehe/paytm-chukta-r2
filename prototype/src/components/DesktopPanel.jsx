import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { ABOUT, PROD_URL } from './about.js'

// Shown beside the phone frame on a laptop (≥1024px): what this is, the two sides of the product,
// and a QR to open it on a phone.
export default function DesktopPanel() {
  const [qr, setQr] = useState('')
  useEffect(() => {
    import('qrcode').then((m) => m.toDataURL(PROD_URL, { margin: 1, width: 240, color: { dark: '#002E6E', light: '#FFFFFF' } }))
      .then(setQr).catch(() => {})
  }, [])
  return (
    <aside className="hidden max-w-[400px] lg:block">
      <div className="text-[13px] font-semibold uppercase tracking-[.14em] text-cyan2">Paytm Innovation Challenge · Track B</div>
      <h1 className="mt-2 text-[40px] font-extrabold leading-[1.05] tracking-tight text-navy">
        Paytm <span className="text-cyan">Chukta</span>
      </h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink2">
        Supplier bills land next to today's collections. The Soundbox reminds at closing time, and the owner pays in one tap with their own Paytm UPI PIN.
      </p>

      {/* The two sides of the product: the merchant app (in the phone) and the distributor dashboard */}
      <div className="mt-5 text-[11.5px] font-bold uppercase tracking-[.12em] text-grey">Two sides of Chukta · try both</div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="relative flex flex-col rounded-2xl bg-white p-3.5 shadow-[var(--shadow-card)] ring-2 ring-navy">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white"><Icon name="phone" size={18} /></span>
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-grey">Shop owners</span>
          </div>
          <div className="mt-2 text-[15px] font-bold leading-tight text-navy">Merchant app</div>
          <div className="mt-1 flex-1 text-[12.5px] leading-snug text-ink2">Bills, Soundbox reminder, one-tap pay</div>
          <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-okbg px-2.5 py-1 text-[12px] font-semibold text-ok">
            <span className="h-2 w-2 rounded-full bg-okfill" />Viewing now <Icon name="chevron" size={14} strokeWidth={2.4} />
          </div>
        </div>

        <Link to="/collect" aria-label="Open Chukta Collect, the distributor dashboard"
          className="group relative flex flex-col rounded-2xl bg-sky p-3.5 shadow-[var(--shadow-card)] ring-2 ring-cyan transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan text-navy"><Icon name="layout" size={18} /></span>
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-grey">Distributors</span>
          </div>
          <div className="mt-2 text-[15px] font-bold leading-tight text-navy">Chukta Collect</div>
          <div className="mt-1 flex-1 text-[12.5px] leading-snug text-ink2">Who paid which invoice, no collection visits</div>
          <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-xl bg-navy px-3 py-2 text-[13px] font-semibold text-white transition group-hover:bg-navy2">
            Open dashboard <Icon name="chevron" size={15} strokeWidth={2.4} className="transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <ul className="mt-5 space-y-2.5 text-[14px] text-ink2 [@media(max-height:820px)]:hidden">
        {[
          ['scan', 'Capture: signed e-invoice QR, else photo / PDF read on the phone'],
          ['shieldCheck', 'Payee check against the GST legal name, 24 h cooling-off'],
          ['speaker', 'Hindi Soundbox reminder, amounts can be muted'],
        ].map(([ic, t]) => (
          <li key={t} className="flex gap-2.5"><span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-navy shadow-sm"><Icon name={ic} size={16} /></span>{t}</li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-line backdrop-blur">
        {qr ? <img src={qr} alt="QR code to open this prototype on a phone" className="h-28 w-28 rounded-lg" /> : <div className="h-28 w-28 rounded-lg bg-mist" />}
        <div className="text-[13.5px] text-ink2">
          <b className="block text-[15px] text-navy">Open on your phone</b>
          Scan with the camera, or open chukta-r2-prototype.vercel.app. Works best in Chrome on Android.
        </div>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-grey">{ABOUT}</p>
    </aside>
  )
}
