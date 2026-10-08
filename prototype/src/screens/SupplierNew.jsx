import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import QrCamera from '../components/QrCamera.jsx'
import { Bi, Btn, Card, Field, Shell, Toggle, inputCls, toast } from '../components/ui.jsx'
import { useStore } from '../store.jsx'
import { parseUpiQr } from '../lib/upi.js'

// Ladder rung L2: add 2–3 suppliers and switch on the 9 pm reminder.
export default function SupplierNew() {
  const navigate = useNavigate()
  const { addSupplier, suppliers, settings, setSettings, logEvent } = useStore()
  const [f, setF] = useState({ name: '', gstin: '', rail: 'qr', vpa: '', payeeName: '' })
  const [scan, setScan] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const saveIt = () => {
    addSupplier({ ...f, name: f.name.trim(), gstin: f.gstin.trim().toUpperCase() })
    logEvent('L2_supplier_added', { supplierCount: suppliers.length + 1 })
    toast(`${f.name.trim()} joda gaya`)
    setF({ name: '', gstin: '', rail: 'qr', vpa: '', payeeName: '' })
  }
  const remind = (on) => {
    setSettings((s) => ({ ...s, reminderOn: on }))
    logEvent(on ? 'L2_reminder_on' : 'L2_reminder_off', {})
    toast(on ? 'Raat 9 baje ka reminder on' : 'Reminder off')
  }

  return (
    <Shell title="Supplier jodein" sub="Add a supplier · L2" back="/?tab=suppliers">
      <Card>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky text-navy"><Icon name="moon" size={22} /></span>
          <Bi hi="Raat 9 baje reminder" en="Soundbox + push: what's due tomorrow" className="flex-1 text-[15px] font-semibold" />
          <Toggle on={settings.reminderOn} onChange={remind} label="9 pm reminder" />
        </div>
      </Card>

      <Card className="mt-3 space-y-3">
        <Field hi="Supplier ka naam" en="as on their bill">
          <input className={inputCls} value={f.name} onChange={set('name')} placeholder="e.g. Sharma Traders" />
        </Field>
        <Field hi="GSTIN" en="optional, for the name check">
          <input className={inputCls + ' uppercase'} maxLength={15} value={f.gstin} onChange={set('gstin')} placeholder="09XXXXX0000X1Z5" />
        </Field>
        <div>
          <div className="text-[13px] font-semibold text-ink2">Supplier paisa kahan leta hai? <span className="font-normal text-grey">(their choice)</span></div>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {[['qr', 'qr', 'UPI / QR'], ['bank', 'bank', 'Bank a/c']].map(([k, ic, l]) => (
              <button key={k} onClick={() => setF((x) => ({ ...x, rail: k }))}
                className={`flex items-center gap-2 rounded-xl p-3 text-[14px] font-semibold ring-1 ${f.rail === k ? 'bg-sky text-navy ring-2 ring-cyan' : 'text-ink2 ring-line'}`}>
                <Icon name={ic} size={18} />{l}
              </button>
            ))}
          </div>
        </div>
        {f.rail === 'qr' && (scan ? (
          <div>
            <QrCamera hint="Supplier ka UPI / Paytm QR" onResult={(t) => {
              const u = parseUpiQr(t)
              if (u) setF((x) => ({ ...x, vpa: u.vpa, payeeName: u.payeeName, name: x.name || u.payeeName }))
              else toast('Yeh UPI QR nahi hai')
              setScan(false)
            }} />
            <Btn variant="soft" className="mt-2 w-full" onClick={() => setScan(false)}>Band karein</Btn>
          </div>
        ) : (
          <>
            <Btn variant="ghost" icon="scan" className="w-full" onClick={() => setScan(true)}>Supplier ka QR scan karein</Btn>
            <Field hi="UPI ID" en="or type it">
              <input className={inputCls} value={f.vpa} onChange={set('vpa')} placeholder="name@bank" autoCapitalize="none" />
            </Field>
            {f.payeeName && <div className="text-[12px] text-grey">QR par naam: <b className="text-ink">{f.payeeName}</b></div>}
          </>
        ))}
        {f.rail === 'bank' && (
          <p className="rounded-xl bg-mist p-3 text-[12.5px] text-ink2">
            Bank a/c supplier: payment Paytm ke "To Bank A/c" se, note mein invoice no. The real app verifies the account name before the first payment.
          </p>
        )}
        <Btn variant="navy" className="w-full" disabled={!f.name.trim()} onClick={saveIt}>Supplier save karein</Btn>
      </Card>

      {suppliers.length > 0 && (
        <Card className="mt-3">
          <b className="text-[14px]">Jode gaye ({suppliers.length})</b>
          <ul className="mt-2 space-y-1 text-[13.5px]">
            {suppliers.map((s) => <li key={s.name} className="flex items-center gap-2"><Icon name="check" size={15} className="text-ok" />{s.name}<span className="text-grey">· {s.rail === 'bank' ? 'Bank' : s.vpa || 'UPI'}</span></li>)}
          </ul>
        </Card>
      )}
      <Btn variant="outline" className="mt-4 w-full" onClick={() => navigate('/?tab=suppliers')}>Ho gaya (done)</Btn>
    </Shell>
  )
}
