export const inr = (n, d = 0) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

const WD = [['Ravi', 'Sun'], ['Som', 'Mon'], ['Mangal', 'Tue'], ['Budh', 'Wed'], ['Guru', 'Thu'], ['Shukra', 'Fri'], ['Shani', 'Sat']]

export function daysFromToday(iso) {
  const a = new Date(); a.setHours(0, 0, 0, 0)
  const b = new Date(iso); b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / 86400000)
}

/** Due label in Hinglish with tone: {hi, en, tone} */
export function dueLabel(iso) {
  const n = daysFromToday(iso)
  if (n < 0) return { hi: `${-n} din se overdue`, en: 'overdue', tone: 'bad' }
  if (n === 0) return { hi: 'Aaj due', en: 'due today', tone: 'bad' }
  if (n === 1) return { hi: 'Kal due', en: 'due tomorrow', tone: 'bad' }
  if (n < 7) { const [h, e] = WD[new Date(iso).getDay()]; return { hi: `Due ${h}`, en: e, tone: 'warn' } }
  return { hi: `${n} din mein due`, en: `in ${n} days`, tone: 'calm' }
}

export const shortDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '–')
export const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
const pad = (n) => String(n).padStart(2, '0')
export const isoDay = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` // local date, not UTC
}
export const fromDay = (d) => (d ? new Date(d + 'T12:00:00').toISOString() : '')
