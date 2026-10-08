import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Bi, Btn, Card, DemoTag, SectionTitle, Shell, Toggle, toast } from '../components/ui.jsx'
import { balance, useStore } from '../store.jsx'
import { DEMO_TODAY_IN } from '../data/demo.js'
import { daysFromToday, dueLabel, inr } from '../lib/fmt.js'
import { getVoices, pickVoice, speak, speechSupported } from '../lib/speech.js'

// Script from deck slide 9, built from the live bill list. With the seed bills it reads exactly as on the
// slide ("Kal Sharma Traders ke ₹12,400 dene hain"). Spoken in Devanagari when a Hindi voice exists
// (romanised Hinglish sounds wrong in hi-IN TTS); known demo names have a Devanagari form.
const DEV = { 'Sharma Traders': 'शर्मा ट्रेडर्स', 'Gupta Medicals': 'गुप्ता मेडिकल्स', 'Jain Stationery Mart': 'जैन स्टेशनरी मार्ट', 'Kanpur Namkeen Agencies': 'कानपुर नमकीन एजेंसीज़', 'Verma Dairy': 'वर्मा डेयरी' }
const short = (n) => n.replace(/\s+(pvt\.?|private)\s+(ltd\.?|limited)$/i, '').trim()
const dev = (n) => DEV[short(n)] || short(n)
const num = (n) => Math.round(n).toLocaleString('en-IN')
const andList = (xs, word) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${word} ${xs[xs.length - 1]}`)

function buildScripts(bills) {
  const open = bills.filter((b) => b.status === 'due').sort((x, y) => new Date(x.dueDate) - new Date(y.dueDate))
  const kal = open.filter((b) => daysFromToday(b.dueDate) === 1)
  const week = open.filter((b) => daysFromToday(b.dueDate) <= 7)
  const sum = (xs) => xs.reduce((t, b) => t + balance(b), 0)
  const IN = num(DEMO_TODAY_IN)
  let full, muted
  if (kal.length === 1) {
    const [b] = kal
    full = { roman: `Aaj ₹${IN} aaye. Kal ${short(b.supplier)} ke ₹${num(balance(b))} dene hain. Chukta karne ke liye Paytm kholein.`,
      hindi: `आज ${IN} रुपये आए। कल ${dev(b.supplier)} के ${num(balance(b))} रुपये देने हैं। चुकता करने के लिए पेटीएम खोलें।` }
    muted = { roman: `Aaj ka collection aa gaya. Kal ${short(b.supplier)} ka bill dena hai. Chukta karne ke liye Paytm kholein.`,
      hindi: `आज का कलेक्शन आ गया। कल ${dev(b.supplier)} का बिल देना है। चुकता करने के लिए पेटीएम खोलें।` }
  } else if (kal.length > 1) {
    const r = andList(kal.map((b) => short(b.supplier)), 'aur'), h = andList(kal.map((b) => dev(b.supplier)), 'और')
    full = { roman: `Aaj ₹${IN} aaye. Kal ${kal.length} bill dene hain, kul ₹${num(sum(kal))}: ${r}. Chukta karne ke liye Paytm kholein.`,
      hindi: `आज ${IN} रुपये आए। कल ${kal.length} बिल देने हैं, कुल ${num(sum(kal))} रुपये: ${h}। चुकता करने के लिए पेटीएम खोलें।` }
    muted = { roman: `Aaj ka collection aa gaya. Kal ${kal.length} bill dene hain: ${r}. Chukta karne ke liye Paytm kholein.`,
      hindi: `आज का कलेक्शन आ गया। कल ${kal.length} बिल देने हैं: ${h}। चुकता करने के लिए पेटीएम खोलें।` }
  } else {
    full = { roman: `Aaj ₹${IN} aaye. Kal koi supplier bill due nahi hai.`, hindi: `आज ${IN} रुपये आए। कल कोई सप्लायर बिल देना नहीं है।` }
    muted = { roman: 'Aaj ka collection aa gaya. Kal koi supplier bill due nahi hai.', hindi: 'आज का कलेक्शन आ गया। कल कोई सप्लायर बिल देना नहीं है।' }
  }
  const wr = andList(week.map((b) => short(b.supplier)), 'aur'), wh = andList(week.map((b) => dev(b.supplier)), 'और')
  const n = week.length
  const weekFull = n ? { roman: `Is hafte ₹${num(sum(week))} dene hain, ${n} ${n === 1 ? 'bill' : 'bills'}: ${wr}.`, hindi: `इस हफ़्ते ${num(sum(week))} रुपये देने हैं, ${n} बिल: ${wh}।` }
    : { roman: 'Is hafte koi bill dena baaki nahi hai.', hindi: 'इस हफ़्ते कोई बिल देना बाकी नहीं है।' }
  const weekMuted = n ? { roman: `Is hafte ${n} ${n === 1 ? 'bill' : 'bills'} dene hain: ${wr}.`, hindi: `इस हफ़्ते ${n} बिल देने हैं: ${wh}।` } : weekFull
  // the reminder points at tomorrow's bill, else the next one due
  return { full, muted, week: weekFull, weekMuted, next: kal[0] || open[0] || null }
}

function Device({ playing }) {
  return (
    <div className="relative mx-auto h-[188px] w-[150px]">
      {/* speaker body */}
      <div className="absolute inset-x-0 bottom-0 top-6 rounded-[28px] bg-[linear-gradient(160deg,#1B2B45,#0B1424)] shadow-[0_18px_30px_-12px_rgba(11,20,36,.7)]">
        <div className="absolute inset-x-5 top-5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/15" />)}
        </div>
        <div className="absolute inset-x-0 bottom-5 flex h-9 items-end justify-center gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} className={`w-1.5 origin-bottom rounded-full bg-cyan ${playing ? 'animate-wave' : 'opacity-40'}`}
              style={{ height: `${[40, 70, 100, 80, 100, 60, 35][i]}%`, animationDelay: `${i * 0.11}s`, transform: playing ? undefined : 'scaleY(.3)' }} />
          ))}
        </div>
      </div>
      {/* QR plate on top */}
      <div className="absolute left-1/2 top-0 grid h-14 w-[104px] -translate-x-1/2 place-items-center rounded-2xl bg-white shadow-md ring-1 ring-line">
        <div className="flex items-center gap-1 text-[11px] font-extrabold tracking-tight text-navy">Paytm <span className="text-cyan">Soundbox</span></div>
      </div>
    </div>
  )
}

export default function Soundbox() {
  const { settings, setSettings, logEvent, bills } = useStore()
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [voice, setVoice] = useState(null)
  const [ready, setReady] = useState(false)
  const [mute, setMute] = useState(false)
  const [playing, setPlaying] = useState('')
  const ok = speechSupported()

  useEffect(() => {
    getVoices().then((v) => { setVoice(pickVoice(v)); setReady(true) })
    return () => { if (speechSupported()) window.speechSynthesis.cancel() }
  }, [])
  useEffect(() => {
    if (hash !== '#reminder') return
    const t = setTimeout(() => document.getElementById('reminder')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80)
    return () => clearTimeout(t)
  }, [hash])

  const SCRIPTS = useMemo(() => buildScripts(bills), [bills])
  const play = (key) => {
    const s = SCRIPTS[key]
    setPlaying(key)
    // the romanised line is for screen reading; the voice reads "rupaye", not the ₹ sign
    speak({ hindi: s.hindi, roman: s.roman.replace(/₹([\d,]+)/g, '$1 rupaye') }, voice, () => setPlaying(''))
  }
  const remind = (on) => {
    setSettings((s) => ({ ...s, reminderOn: on }))
    logEvent(on ? 'L2_reminder_on' : 'L2_reminder_off', {})
    toast(on ? 'Raat 9 baje ka reminder on' : 'Reminder off')
  }
  const main = mute ? 'muted' : 'full'
  const isHi = voice && /^hi/i.test(voice.lang)
  const next = SCRIPTS.next

  return (
    <Shell title="Soundbox" sub="Raat 9 baje ka reminder · simulator">
      <Card className="overflow-hidden bg-[linear-gradient(180deg,#E5F7FE,#FFFFFF_70%)] pt-5">
        <div className="flex items-start justify-between"><Bi hi="Raat 9 baje" en="closing-time summary" className="text-[13px] font-semibold text-navy" /><DemoTag /></div>
        <div className="mt-2"><Device playing={!!playing} /></div>
        <div className="relative mt-5 rounded-2xl bg-navy p-4 text-white">
          <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-navy" />
          <div className="relative text-[15px] font-medium italic leading-snug">"{SCRIPTS[main].roman}"</div>
          <div className="relative mt-1.5 text-[13px] leading-snug text-white/70">{SCRIPTS[main].hindi}</div>
        </div>
        <Btn size="lg" icon={playing === main ? 'speaker' : 'play'} className="mt-4 w-full" disabled={!ok} onClick={() => play(main)}>
          {playing === main ? 'Bol raha hai…' : 'Suniye (play)'}
        </Btn>
        <Btn variant="soft" className="mt-2 w-full" disabled={!ok} onClick={() => play(mute ? 'weekMuted' : 'week')}>
          <Icon name="sparkle" size={17} />"Is hafte kitna dena hai?"
        </Btn>
        <div className="mt-1 text-center text-[11px] text-grey">AI Soundbox owners can ask this aloud</div>
      </Card>

      <Card className="mt-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mist text-navy"><Icon name={mute ? 'mute' : 'speaker'} size={20} /></span>
        <Bi hi="Rakam mat bolo" en="mute amounts (customers nearby)" className="flex-1 text-[14.5px] font-semibold" />
        <Toggle on={mute} onChange={setMute} label="Mute amounts" />
      </Card>
      <Card id="reminder" className="mt-3 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky text-navy"><Icon name="moon" size={20} /></span>
        <Bi hi="Raat 9 baje reminder" en="Soundbox + push · ladder L2" className="flex-1 text-[14.5px] font-semibold" />
        <Toggle on={settings.reminderOn} onChange={remind} label="9 pm reminder" />
      </Card>

      <SectionTitle right={<DemoTag>demo preview</DemoTag>}>Phone par notification</SectionTitle>
      <div className="w-full rounded-2xl bg-white/95 p-3.5 text-left shadow-[var(--shadow-lift)] ring-1 ring-line">
        <div className="flex items-center gap-2 text-[11.5px] text-grey">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-navy text-[9px] font-extrabold text-cyan">P</span>
          Paytm for Business · 9:00 pm
        </div>
        {next ? (
          <>
            <button onClick={() => navigate(`/bill/${next.id}`)} className="mt-1.5 block w-full text-left">
              <div className="text-[14px] font-semibold text-ink">
                {daysFromToday(next.dueDate) === 1 ? 'Kal' : dueLabel(next.dueDate).hi + ':'} {inr(balance(next))} dene hain: {short(next.supplier)}
              </div>
              <div className="text-[13px] text-ink2">Inv #{next.invoiceNo} · Tap karke ek baar mein chukta karein</div>
            </button>
            <div className="mt-2.5 flex gap-2 text-[12.5px] font-semibold text-navy">
              <button onClick={() => navigate(`/payee/${next.id}`)} className="rounded-lg bg-sky px-3 py-1.5 hover:bg-sky2">Chukta karein</button>
              <button onClick={() => navigate(`/later/${next.id}`)} className="rounded-lg bg-mist px-3 py-1.5 hover:bg-line">7 din baad</button>
            </div>
          </>
        ) : (
          <div className="mt-1.5 text-[14px] font-semibold text-ink">Sab supplier bills chukta. Koi reminder nahi.</div>
        )}
      </div>
      <div className="mt-2 px-0.5 text-[12px] text-grey">Reminder se paid tak: notification → bill → Chukta karein → Paytm PIN (4 taps).</div>

      <div className="mt-4 rounded-2xl bg-mist p-3.5 text-[12px] text-ink2">
        {!ok ? 'Is browser mein Web Speech API nahi hai.'
          : !ready ? 'Voice dhoondh rahe hain…'
          : voice ? <>Voice: <b>{voice.name}</b> ({voice.lang}){!isHi && ' · Hindi voice nahi mili, Hinglish padh raha hai'}</>
          : 'Hindi voice nahi mili. Android: Settings → Google TTS → Hindi install karein.'}
        <div className="mt-1">Asli Soundbox par yeh line daily summary ke saath bajegi; yahan phone ka speaker hai.</div>
      </div>
    </Shell>
  )
}
