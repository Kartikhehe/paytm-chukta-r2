// Decode an e-invoice signed QR (JWT/JWS compact). See prototype/NOTES.md (a).
// The signature is NOT verified here: the UI says "IRP signature check: demo".

export const EINV_FIELDS = ['SellerGstin', 'BuyerGstin', 'DocNo', 'DocTyp', 'DocDt', 'TotInvVal', 'ItemCnt', 'MainHsnCode', 'Irn', 'IrnDt']

function b64urlDecode(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')
  const bin = atob(b64)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function looksLikeJwt(text) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test((text || '').trim())
}

/** Returns { header, fields, iss } or null if the text is not a decodable e-invoice JWT. */
export function decodeEinvoice(text) {
  if (!looksLikeJwt(text)) return null
  try {
    const [h, p] = text.trim().split('.')
    const header = JSON.parse(b64urlDecode(h))
    const payload = JSON.parse(b64urlDecode(p))
    // IRP shape: { data: "<JSON string>", iss: "NIC" }. Also accept a flat payload.
    let fields = payload
    if (typeof payload.data === 'string') fields = JSON.parse(payload.data)
    else if (payload.data && typeof payload.data === 'object') fields = payload.data
    if (!fields.SellerGstin && !fields.DocNo && !fields.Irn) return null
    return { header, fields, iss: payload.iss || null }
  } catch {
    return null
  }
}

// "03/05/2021" -> ISO date string
export function parseDocDt(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || '')
  if (!m) return null
  return new Date(+m[3], +m[2] - 1, +m[1]).toISOString()
}

// A sample shaped exactly like the IRP output, with DEMO values (unsigned), for the "try a sample" button.
export function demoEinvoiceJwt() {
  const enc = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const d = new Date(); const dd = String(d.getDate()).padStart(2, '0'); const mm = String(d.getMonth() + 1).padStart(2, '0')
  const data = {
    SellerGstin: '09DEMOB0002B1Z2', BuyerGstin: '09DEMOZ9999Z1Z9', DocNo: 'GM/2026/3402', DocTyp: 'INV',
    DocDt: `${dd}/${mm}/${d.getFullYear()}`, TotInvVal: 6420.0, ItemCnt: 7, MainHsnCode: '300490',
    Irn: 'demo0000000000000000000000000000000000000000000000000000000000ab', IrnDt: `${d.getFullYear()}-${mm}-${dd} 10:42:11`,
  }
  return `${enc({ alg: 'RS256', kid: 'DEMO', typ: 'JWT' })}.${enc({ data: JSON.stringify(data), iss: 'DEMO' })}.demo-unsigned`
}
