import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Bi, Btn, Card, DemoTag, SectionTitle, Shell, Toggle, toast } from '../components/ui.jsx'
import { useStore } from '../store.jsx'
import { getVoices, pickVoice, speak, speechSupported } from '../lib/speech.js'

// Script from deck slide 9. Spoken in Devanagari when a Hindi voice exists (romanised Hinglish sounds wrong in hi-IN TTS).
const SCRIPTS = {
  full: {
    roman: 'Aaj ₹31,420 aaye. Kal Sharma Traders ke ₹12,400 dene hain. Chukta karne ke liye Paytm kholein.',
    hindi: 'आज 31,420 रुपये आए। कल शर्मा ट्रेडर्स के 12,400 रुपये देने हैं। चुकता करने के लिए पेटीएम खोलें।',
    say: 'Aaj 31,420 rupaye aaye. Kal Sharma Traders ke 12,400 rupaye dene hain. Chukta karne ke liye Paytm kholein.',
  },
  muted: {
    roman: 'Aaj ka collection aa gaya. Kal Sharma Traders ka bill dena hai. Chukta karne ke liye Paytm kholein.',
    hindi: 'आज का कलेक्शन आ गया। कल शर्मा ट्रेडर्स का बिल देना है। चुकता करने के लिए पेटीएम खोलें।',
    say: 'Aaj ka collection aa gaya. Kal Sharma Traders ka bill dena hai. Chukta karne ke liye Paytm kholein.',
  },
  week: {
    roman: 'Is hafte ₹21,350 dene hain, 2 bills: Sharma Traders aur Gupta Medicals.',
    hindi: 'इस हफ़्ते 21,350 रुपये देने हैं, दो बिल: शर्मा ट्रेडर्स और गुप्ता मेडिकल्स।',
    say: 'Is hafte 21,350 rupaye dene hain, 2 bills: Sharma Traders aur Gupta Medicals.',
  },
  weekMuted: {
    roman: 'Is hafte 2 bills dene hain: Sharma Traders aur Gupta Medicals.',
    hindi: 'इस हफ़्ते दो बिल देने हैं: शर्मा ट्रेडर्स और गुप्ता मेडिकल्स।',
    say: 'Is hafte 2 bills dene hain: Sharma Traders aur Gupta Medicals.',
  },
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
  useEffect(() => { if (hash === '#reminder') document.getElementById('reminder')?.scrollIntoView({ block: 'center' }) }, [hash])

  const play = (key) => {
    const s = SCRIPTS[key]
    setPlaying(key)
    speak({ hindi: s.hindi, roman: s.say }, voice, () => setPlaying(''))
  }
  const remind = (on) => {
    setSettings((s) => ({ ...s, reminderOn: on }))
    logEvent(on ? 'L2_reminder_on' : 'L2_reminder_off', {})
    toast(on ? 'Raat 9 baje ka reminder on' : 'Reminder off')
  }
  const main = mute ? 'muted' : 'full'
  const isHi = voice && /^hi/i.test(voice.lang)
  const sharma = bills.find((b) => b.id === 'b1' && b.status === 'due')

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
      <button onClick={() => sharma ? navigate(`/payee/${sharma.id}`) : navigate('/')}
        className="w-full rounded-2xl bg-white/95 p-3.5 text-left shadow-[var(--shadow-lift)] ring-1 ring-line active:scale-[.99]">
        <div className="flex items-center gap-2 text-[11.5px] text-grey">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-navy text-[9px] font-extrabold text-cyan">P</span>
          Paytm for Business · 9:00 pm
        </div>
        <div className="mt-1.5 text-[14px] font-semibold text-ink">Kal ₹12,400 dene hain: Sharma Traders</div>
        <div className="text-[13px] text-ink2">Inv #4471 · Tap karke ek baar mein chukta karein</div>
        <div className="mt-2.5 flex gap-2 text-[12.5px] font-semibold text-navy">
          <span className="rounded-lg bg-sky px-3 py-1.5">Chukta karein</span><span className="rounded-lg bg-mist px-3 py-1.5">7 din baad</span>
        </div>
      </button>
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
