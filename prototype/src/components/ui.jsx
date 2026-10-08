import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import DesktopPanel from './DesktopPanel.jsx'
import { ABOUT } from './about.js'

/* ---------- navigation ---------- */

/** Back that never leaves the app: browser-back when there is in-app history, else a fallback route. */
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  return () => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate(fallback, { replace: true }))
}

/* ---------- small building blocks ---------- */

/** Hindi-first label with a small English sub-label. */
export function Bi({ hi, en, className = '', enClass = '' }) {
  return (
    <span className={className}>
      {hi}
      {en && <span className={`block text-[11px] font-medium leading-tight opacity-70 ${enClass}`}>{en}</span>}
    </span>
  )
}

const BTN = {
  cyan: 'bg-cyan text-navy shadow-[0_6px_16px_-6px_rgba(0,186,242,.7)] hover:brightness-105',
  navy: 'bg-navy text-white shadow-[0_6px_16px_-8px_rgba(0,46,110,.7)] hover:bg-navy2',
  outline: 'bg-white text-navy ring-[1.5px] ring-inset ring-navy/80 hover:bg-sky/60',
  ghost: 'bg-sky text-navy hover:bg-sky2',
  soft: 'bg-white text-navy ring-1 ring-inset ring-line hover:bg-mist',
  ok: 'bg-okfill text-white shadow-[0_6px_16px_-8px_rgba(18,183,106,.8)]',
  danger: 'bg-white text-bad ring-1 ring-inset ring-bad/40 hover:bg-badbg',
}

export function Btn({ variant = 'cyan', size = 'md', icon, className = '', children, ...rest }) {
  const s = size === 'lg' ? 'min-h-13 px-5 text-[16px]' : size === 'sm' ? 'min-h-9 px-3 text-[13px]' : 'min-h-11 px-4 text-[15px]'
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold leading-tight transition active:scale-[.98] ${s} ${BTN[variant]} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 19} />}
      {children}
    </button>
  )
}

export function Card({ className = '', children, as: As = 'div', ...rest }) {
  // A caller-supplied bg-* wins over the default white (Tailwind does not resolve class conflicts by order).
  const bg = /(^|\s)bg-/.test(className) ? '' : 'bg-white'
  return <As className={`rounded-2xl p-4 shadow-[var(--shadow-card)] ring-1 ring-line/70 ${bg} ${className}`} {...rest}>{children}</As>
}

const TONE = {
  sky: 'bg-sky text-navy', ok: 'bg-okbg text-ok', warn: 'bg-warnbg text-warn', bad: 'bg-badbg text-bad',
  navy: 'bg-navy text-white', grey: 'bg-mist text-ink2', demo: 'bg-warnbg text-warn ring-1 ring-inset ring-warnfill/40',
}
export function Chip({ tone = 'sky', icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${TONE[tone]} ${className}`}>
      {icon && <Icon name={icon} size={13} strokeWidth={2.2} />}{children}
    </span>
  )
}

export const DemoTag = ({ children = 'demo' }) => <Chip tone="demo">{children}</Chip>

const AV = ['#E5F7FE:#0369A1', '#EEF4FF:#3538CD', '#FDF2FA:#C11574', '#ECFDF3:#067647', '#FFFAEB:#B54708', '#F4F3FF:#5925DC', '#FEF3F2:#B42318']
export function Avatar({ name = '', size = 42 }) {
  const initials = name.replace(/[^A-Za-zऀ-ॿ ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const h = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const [bg, fg] = AV[h % AV.length].split(':')
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-bold" style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36 }}>
      {initials}
    </span>
  )
}

export function Field({ hi, en, children, hint }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-ink2">{hi}</span>
      {en && <span className="ml-1 text-[11.5px] text-grey">{en}</span>}
      <div className="mt-1.5">{children}</div>
      {hint && <div className="mt-1 text-[11.5px] text-grey">{hint}</div>}
    </label>
  )
}
export const inputCls = 'w-full min-h-12 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[16px] text-ink outline-none transition placeholder:text-grey/60 focus:border-cyan focus:ring-4 focus:ring-cyan/15'

export function SectionTitle({ children, right, className = '' }) {
  return (
    <div className={`mb-2 mt-5 flex items-end justify-between gap-2 px-0.5 ${className}`}>
      <h2 className="text-[15px] font-bold text-ink">{children}</h2>
      {right}
    </div>
  )
}

export function Toggle({ on, onChange, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-cyan' : 'bg-[#D0D5DD]'}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

/* ---------- toast ---------- */
const listeners = new Set()
export function toast(msg) { listeners.forEach((l) => l(msg)) }
function Toaster() {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    let t
    const l = (m) => { setMsg(m); clearTimeout(t); t = setTimeout(() => setMsg(''), 2400) }
    listeners.add(l)
    return () => { listeners.delete(l); clearTimeout(t) }
  }, [])
  if (!msg) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="animate-in rounded-xl bg-ink/92 px-4 py-2.5 text-center text-[13.5px] font-medium text-white shadow-lg">{msg}</div>
    </div>
  )
}

/* ---------- bottom sheet ---------- */
export function Sheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-ink/40" onClick={onClose}>
      <div className="animate-in max-h-[85%] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {title && <div className="mb-3 text-[17px] font-bold text-ink">{title}</div>}
        {children}
      </div>
    </div>
  )
}

/* ---------- frame: phone on desktop, full-bleed on a phone ---------- */
export function Device({ children }) {
  return (
    <div className="min-h-dvh md:flex md:items-center md:justify-center md:gap-12 md:bg-[radial-gradient(1200px_600px_at_20%_10%,#D9F3FD,transparent),linear-gradient(160deg,#EEF4FB,#DCE6F2)] md:p-6">
      <DesktopPanel />
      <div className="relative mx-auto flex h-dvh w-full flex-col overflow-hidden bg-bg md:mx-0 md:h-[min(860px,calc(100dvh-48px))] md:w-[410px] md:shrink-0 md:rounded-[46px] md:border-[10px] md:border-[#0B1424] md:shadow-[0_30px_80px_-20px_rgba(0,46,110,.45)]">
        {children}
        <Toaster />
      </div>
    </div>
  )
}

const DemoStrip = () => (
  <div className="flex items-center justify-center gap-1.5 bg-[#FFF6E0] px-3 py-1 text-[11px] font-semibold text-warn" title="Prototype: demo data, never moves money">
    <Icon name="shield" size={13} strokeWidth={2.2} /><span className="truncate">PROTOTYPE · demo · paise kabhi nahi bhejta</span>
  </div>
)

/** Merchant-app screen. `hero` replaces the plain title bar (home screen); `footer` is a sticky action bar. */
export function Shell({ title, sub, back, right, hero, children, nav = true, footer }) {
  const navigate = useNavigate()
  const goBack = useBack()
  const { pathname, search, hash } = useLocation()
  const main = useRef(null)
  // New screen → top. With a #hash the screen scrolls to that section itself.
  useEffect(() => { if (!hash) main.current?.scrollTo(0, 0) }, [pathname, search, hash])
  return (
    <Device>
      <header className="z-20 shrink-0 bg-navy text-white">
        <div className="h-[env(safe-area-inset-top)]" />
        {!hero && (
          <div className="flex min-h-14 items-center gap-1.5 px-2 py-2">
            {back !== undefined && (
              <button aria-label="Back" onClick={() => (typeof back === 'string' ? navigate(back) : goBack())}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-white/10"><Icon name="back" size={24} /></button>
            )}
            <div className={`min-w-0 flex-1 ${back === undefined ? 'pl-2' : ''}`}>
              <div className="truncate text-[17px] font-semibold leading-tight">{title}</div>
              {sub && <div className="truncate text-[12px] text-white/70">{sub}</div>}
            </div>
            {right}
          </div>
        )}
        <DemoStrip />
      </header>
      <main ref={main} className="no-scrollbar flex-1 overflow-y-auto">
        {hero && <div className="text-white">{hero}</div>}
        <div key={pathname + search} className="animate-in px-4 pb-6 pt-4">{children}</div>
        <p className="px-6 pb-6 text-center text-[10.5px] leading-snug text-grey/80">{ABOUT}</p>
      </main>
      {footer && <div className="z-10 shrink-0 border-t border-line bg-white px-4 py-3">{footer}</div>}
      {nav && <BottomNav />}
    </Device>
  )
}

function BottomNav() {
  const { pathname, search } = useLocation()
  const tab = new URLSearchParams(search).get('tab') || 'due'
  const item = (to, icon, hi, active) => (
    <Link to={to} className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 pb-1 pt-2 text-[10.5px] font-semibold ${active ? 'text-navy' : 'text-grey'}`}>
      <Icon name={icon} size={22} strokeWidth={active ? 2.2 : 1.8} />
      <span>{hi}</span>
    </Link>
  )
  return (
    <nav className="relative z-20 flex shrink-0 items-end border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      {item('/', 'home', 'Bills', pathname === '/' && tab === 'due')}
      {item('/?tab=paid', 'history', 'Diya', pathname === '/' && tab === 'paid')}
      <div className="flex flex-1 justify-center">
        <Link to="/capture" aria-label="Bill scan"
          className="-mt-6 flex flex-col items-center gap-0.5 text-[11px] font-semibold text-navy">
          <span className={`grid h-14 w-14 place-items-center rounded-full bg-cyan text-navy shadow-[0_8px_20px_-6px_rgba(0,186,242,.9)] ring-4 ring-white ${pathname === '/capture' ? 'bg-navy text-white' : ''}`}>
            <Icon name="scan" size={26} strokeWidth={2.2} />
          </span>
          <span className="pb-1">Scan</span>
        </Link>
      </div>
      {item('/?tab=suppliers', 'users', 'Suppliers', pathname === '/' && tab === 'suppliers')}
      {item('/soundbox', 'speaker', 'Soundbox', pathname === '/soundbox')}
    </nav>
  )
}
