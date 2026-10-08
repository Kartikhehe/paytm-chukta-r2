// Standard UPI push intent (never a collect request). See prototype/NOTES.md (b), (c).
export function buildIntent({ vpa, name, amount, invoiceNo, mc }) {
  const p = new URLSearchParams()
  p.set('pa', vpa.trim())
  p.set('pn', name.trim())
  p.set('am', Number(amount).toFixed(2))
  p.set('cu', 'INR')
  p.set('tn', `INV-${invoiceNo}`)
  if (mc) p.set('mc', mc) // only when copied from the supplier's own merchant QR
  return 'upi://pay?' + p.toString().replace(/\+/g, '%20').replace(/%40/g, '@') // literal @ in pa, as in NPCI examples
}

/** Parse a supplier's UPI QR (upi://pay?pa=...&pn=...). Returns null if not a UPI QR. */
export function parseUpiQr(text) {
  const t = (text || '').trim()
  if (!/^upi:\/\/pay\?/i.test(t)) return null
  const q = new URLSearchParams(t.slice(t.indexOf('?') + 1))
  const pa = q.get('pa')
  if (!pa) return null
  return { vpa: pa, payeeName: q.get('pn') || '', mc: q.get('mc') || '', amount: q.get('am') || '' }
}

export const isVpa = (s) => /^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.]{1,64}$/.test((s || '').trim())
export const isDemoVpa = (s) => /@invalid$/i.test(s || '')
