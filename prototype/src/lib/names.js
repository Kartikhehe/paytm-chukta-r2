// Payee check: bill supplier name vs GST legal name. Lookup table is DEMO (data/demo.js).
import { GST_DEMO } from '../data/demo.js'

const SUFFIX = /\b(M\/S|MS|PVT|PRIVATE|LTD|LIMITED|LLP|CO|COMPANY|AND|THE|DEMO)\b/g

export function normName(s) {
  return (s || '')
    .toUpperCase()
    .replace(/[&]/g, ' AND ')
    .replace(/M\/S\.?/g, ' ')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(SUFFIX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** @returns {{status:'match'|'mismatch'|'unknown', legal:string|null}} */
export function payeeCheck(supplier, gstin) {
  const legal = GST_DEMO[(gstin || '').toUpperCase().trim()] || null
  if (!legal) return { status: 'unknown', legal: null }
  const a = normName(supplier), b = normName(legal)
  if (a && b && (a === b || a.includes(b) || b.includes(a))) return { status: 'match', legal }
  return { status: 'mismatch', legal }
}
