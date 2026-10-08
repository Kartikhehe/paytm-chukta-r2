// All data in this file is DEMO DATA: fictional suppliers, GSTINs and payees.
// Demo payee UPI IDs use the non-existent handle "@invalid" so a tap can never reach a real person.

const day = (offset, h = 0, m = 0) => {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

export const DEMO_TODAY_IN = 31420 // "Aaj aaye" (money received today), demo figure from deck slide 9

export const PAY_FROM = { bank: 'SBI', last4: '2231', note: 'Soundbox settles here' }

// The demo shop whose phone this is (fictional).
export const MERCHANT = { name: 'Shree Ganesh Kirana', area: 'Kalyanpur, Kanpur', vpa: 'demo shop' }

export function seedBills() {
  return [
    {
      id: 'b1', demo: true, supplier: 'Sharma Traders', gstin: '09DEMOA0001A1Z1', category: 'FMCG',
      amount: 12400, invoiceNo: '4471', billDate: day(-14), dueDate: day(1), status: 'due',
      source: 'Distributor push', einvoice: false, paidCount: 12,
      rail: 'bank', bankName: 'HDFC', bankLast4: '4410',
      vpa: 'sharmatraders.demo@invalid', payeeName: 'SHARMA TRADERS',
    },
    {
      id: 'b2', demo: true, supplier: 'Gupta Medicals Pvt Ltd', gstin: '09DEMOB0002B1Z2', category: 'Pharma',
      amount: 8950, invoiceNo: 'GM/2026/3318', billDate: day(-3), dueDate: day(4), status: 'due',
      source: 'e-Invoice QR', einvoice: true, paidCount: 7,
      rail: 'qr', vpa: 'guptamedicals.demo@invalid', payeeName: 'GUPTA MEDICALS PVT LTD',
    },
    {
      id: 'b3', demo: true, supplier: 'Verma Dairy', gstin: '09DEMOC0003C1Z3', category: 'Dairy',
      amount: 1800, invoiceNo: '88', billDate: day(-1), dueDate: day(0), status: 'paid', paidAt: day(0, 9, 12), payments: [{ amount: 1800, at: day(0, 9, 12), how: 'qr' }],
      source: 'Photo', einvoice: false, paidCount: 30,
      rail: 'qr', vpa: 'vermadairy.demo@invalid', payeeName: 'VERMA DAIRY',
    },
    {
      id: 'b4', demo: true, supplier: 'Kanpur Namkeen Agencies', gstin: '09DEMOD0004D1Z4', category: 'FMCG',
      amount: 3240, invoiceNo: 'KNA/219', billDate: day(-2), dueDate: day(11), status: 'due',
      source: 'Photo', einvoice: false, paidCount: 0,
      rail: 'qr', vpa: 'balaji.ent.demo@invalid', payeeName: 'SHREE BALAJI ENTERPRISES',
    },
    {
      id: 'b5', demo: true, supplier: 'Jain Stationery Mart', gstin: '09DEMOE0005E1Z5', category: 'Stationery',
      amount: 2150, invoiceNo: '1182', billDate: day(-5), dueDate: day(9), status: 'due',
      source: 'PDF / WhatsApp', einvoice: false, paidCount: 4, payeeChanged: true,
      rail: 'bank', bankName: 'PNB', bankLast4: '7702',
      vpa: 'jainstationery.demo@invalid', payeeName: 'JAIN STATIONERY MART',
    },
  ]
}

// DEMO GST legal-name lookup. A real build would call the GST public search API.
export const GST_DEMO = {
  '09DEMOA0001A1Z1': 'SHARMA TRADERS',
  '09DEMOB0002B1Z2': 'GUPTA MEDICALS PRIVATE LIMITED',
  '09DEMOC0003C1Z3': 'VERMA DAIRY',
  '09DEMOD0004D1Z4': 'SHREE BALAJI ENTERPRISES',
  '09DEMOE0005E1Z5': 'JAIN STATIONERY MART',
}

// Chukta Collect: distributor view (DEMO). Tiles are the illustrative numbers shown on deck slide 9.
export const COLLECT_TILES = [
  { value: '₹8.4 L', hi: 'Is hafte bheje', en: 'sent this week' },
  { value: '₹6.1 L', hi: 'Chukta mein mile', en: 'paid in Chukta' },
  { value: '212', hi: 'Active retailers', en: 'retailers active' },
  { value: '–4 din', hi: 'Payment jaldi', en: 'avg days to pay vs before' },
]

export const COLLECT_ROWS = [
  { retailer: 'Agarwal Kirana', area: 'Kalyanpur', invoice: '4469', amount: 18200, sent: -6, status: 'paid' },
  { retailer: 'New Shiv Medical', area: 'Kakadeo', invoice: '4470', amount: 9450, sent: -5, status: 'seen', due: 3 },
  { retailer: 'Sharma General Store', area: 'Nankari', invoice: '4471', amount: 12400, sent: -5, status: 'later' },
  { retailer: 'Maa Durga Provision', area: 'Swaroop Nagar', invoice: '4472', amount: 6730, sent: -4, status: 'paid' },
  { retailer: 'Campus Canteen', area: 'IITK', invoice: '4473', amount: 4120, sent: -4, status: 'sent', due: 6 },
  { retailer: 'Rastogi Dairy', area: 'MT Section', invoice: '4474', amount: 2980, sent: -3, status: 'overdue', due: -1 },
  { retailer: 'Gupta Kirana Bhandar', area: 'Generalganj', invoice: '4475', amount: 15600, sent: -3, status: 'paid' },
  { retailer: 'Shukla Medical Hall', area: 'Kakadeo', invoice: '4476', amount: 7310, sent: -2, status: 'dispute' },
  { retailer: 'Annapurna Sweets', area: 'Nayaganj', invoice: '4477', amount: 5260, sent: -2, status: 'seen', due: 5 },
  { retailer: 'Mishra Stores', area: 'Kalyanpur', invoice: '4478', amount: 11040, sent: -1, status: 'paid' },
  { retailer: 'Krishna Bakery', area: 'Swaroop Nagar', invoice: '4479', amount: 3470, sent: -1, status: 'sent', due: 7 },
  { retailer: 'Pandey Pharmacy', area: 'Nankari', invoice: '4480', amount: 8890, sent: 0, status: 'sent', due: 7 },
]

export const COLLECT_STATUS = {
  paid: { hi: 'Paid · matched', cls: 'bg-okbg text-ok' },
  seen: { hi: 'Seen', cls: 'bg-sky text-navy' },
  sent: { hi: 'Sent', cls: 'bg-mist text-grey' },
  later: { hi: '7 din baad', cls: 'bg-warnbg text-warn' },
  overdue: { hi: 'Overdue', cls: 'bg-badbg text-bad' },
  dispute: { hi: 'Galat bill (dispute)', cls: 'bg-badbg text-bad' },
}
