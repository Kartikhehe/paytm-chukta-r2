// Bill capture helpers: load photo / PDF onto a canvas, look for a QR first, else OCR (tesseract.js eng+hin).
// Heavy libraries are loaded on demand so the inbox stays fast on a cheap phone.
import jsQR from 'jsqr'

export async function fileToCanvas(file) {
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return pdfToCanvas(file)
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const max = 2400
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * k)
    c.height = Math.round(img.naturalHeight * k)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    return c
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function pdfToCanvas(file) {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const page = await doc.getPage(1)
  const vp = page.getViewport({ scale: 2.5 })
  const c = document.createElement('canvas')
  c.width = vp.width
  c.height = vp.height
  await page.render({ canvasContext: c.getContext('2d'), viewport: vp, canvas: c }).promise
  return c
}

/** Try jsQR at a few scales (dense e-invoice QRs need resolution; small ones need less noise). */
export function scanQrInCanvas(src) {
  for (const max of [1600, 1000, 2400, 700]) {
    const k = Math.min(1, max / Math.max(src.width, src.height))
    const c = document.createElement('canvas')
    c.width = Math.round(src.width * k)
    c.height = Math.round(src.height * k)
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(src, 0, 0, c.width, c.height)
    const img = ctx.getImageData(0, 0, c.width, c.height)
    const r = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })
    if (r?.data) return r.data
  }
  return null
}

let workerP = null
export async function runOcr(canvas, onProgress) {
  if (!workerP) {
    workerP = import('tesseract.js').then(({ createWorker }) =>
      createWorker(['eng', 'hin'], 1, {
        logger: (m) => onProgress?.(m),
      }),
    )
  }
  const worker = await workerP
  const { data } = await worker.recognize(canvas)
  return data.text || ''
}

// 14th char is always Z; OCR often reads it as 2, so accept both and normalise.
const GSTIN_RE = /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z][Z2][0-9A-Z]\b/g
const NUM_RE = /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d{3,7}(?:\.\d{1,2})?)/gi
const AMOUNT_KEYS = [
  /grand\s*total/i, /net\s*(amount|payable|total)/i, /amount\s*payable/i, /total\s*(invoice\s*)?(amount|value)/i,
  /invoice\s*value/i, /कुल\s*(राशि|योग)?/, /योग/, /\btotal\b/i,
]

const toNum = (s) => Number(String(s).replace(/,/g, ''))

/** Pull amount / invoice no. / date / GSTIN / supplier from OCR text. Every value is a guess for the owner to confirm. */
export function extractFields(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const upper = text.toUpperCase()
  const out = {}

  const gst = upper.match(GSTIN_RE)
  if (gst) out.gstin = gst[0].slice(0, 13) + 'Z' + gst[0].slice(14)

  // Same line only ([ \t], not \s), and keep looking past "TAX INVOICE" headings until a value with a digit.
  const INV_RES = [
    /(?:invoice|inv|bill|challan|voucher)[ \t]*(?:number|num|no)?[ \t]*[.#:]*[ \t]*[:\-]?[ \t]*([A-Z0-9][A-Z0-9/\-]{0,24})/gi,
    /(?:बिल|चालान|इनवॉइस)[ \t]*(?:नं|नंबर|संख्या)?\.?[ \t]*[:\-]?[ \t]*([A-Z0-9][A-Z0-9/\-]{0,24})/gi,
  ]
  for (const re of INV_RES) {
    const hit = [...text.matchAll(re)].find((m) => /\d/.test(m[1]))
    if (hit) { out.invoiceNo = hit[1]; break }
  }

  const dateNear = text.match(/(?:date|dt|dated|दिनांक|तारीख)\.?\s*[:\-]?\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/i)
  const anyDate = text.match(/\b(\d{1,2}[/\-.]\d{1,2}[/\-.](?:\d{4}|\d{2}))\b/)
  const ds = (dateNear || anyDate)?.[1]
  if (ds) {
    const [d, m, y] = ds.split(/[/\-.]/).map(Number)
    const yy = y < 100 ? 2000 + y : y
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) out.billDate = new Date(yy, m - 1, d, 12).toISOString()
  }

  for (const key of AMOUNT_KEYS) {
    const hit = lines.filter((l) => key.test(l))
    const nums = hit.flatMap((l) => [...l.matchAll(NUM_RE)].map((m) => toNum(m[1]))).filter((n) => n >= 10)
    if (nums.length) { out.amount = Math.max(...nums); break }
  }
  if (out.amount == null) {
    const dec = [...text.matchAll(/\d{1,3}(?:,\d{2,3})*\.\d{2}\b/g)].map((m) => toNum(m[0]))
    if (dec.length) out.amount = Math.max(...dec)
  }

  const skip = /tax\s*invoice|invoice|gstin|original|duplicate|bill\s*of\s*supply|estimate|challan|phone|mob|email/i
  const name = lines.find((l) => /[A-Za-zऀ-ॿ]{3,}/.test(l) && !skip.test(l) && l.length >= 4 && l.length <= 48)
  if (name) out.supplier = name.replace(/[^A-Za-z0-9ऀ-ॿ&.,'() /-]/g, '').trim()

  return out
}
