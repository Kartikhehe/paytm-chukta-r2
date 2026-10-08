const cell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export const toCsv = (rows) => rows.map((r) => r.map(cell).join(',')).join('\r\n')
export const toTsv = (rows) => rows.map((r) => r.map((v) => (v == null ? '' : String(v).replace(/[\t\r\n]+/g, ' '))).join('\t')).join('\n')

export function download(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿' + text], { type: mime }) // BOM so Excel reads Hindi correctly
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}
