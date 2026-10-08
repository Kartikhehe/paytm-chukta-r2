import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { seedBills } from './data/demo.js'

// localStorage can throw (private mode, blocked storage): every access is guarded.
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const K = {
  bills: 'chukta.bills.v2', events: 'chukta.events.v1', resp: 'chukta.respondent.v1',
  suppliers: 'chukta.suppliers.v1', settings: 'chukta.settings.v1',
}
const Store = createContext(null)

export const paidSoFar = (b) => (b.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
export const balance = (b) => Math.max(0, Number(b.amount || 0) - paidSoFar(b))

export function StoreProvider({ children }) {
  const [bills, setBills] = useState(() => load(K.bills, null) || seedBills())
  const [events, setEvents] = useState(() => load(K.events, []))
  const [respondent, setRespondent] = useState(() => load(K.resp, ''))
  const [suppliers, setSuppliers] = useState(() => load(K.suppliers, []))
  const [settings, setSettings] = useState(() => load(K.settings, { reminderOn: false, reminderTime: '21:00' }))

  useEffect(() => { save(K.bills, bills) }, [bills])
  useEffect(() => { save(K.events, events) }, [events])
  useEffect(() => { save(K.resp, respondent) }, [respondent])
  useEffect(() => { save(K.suppliers, suppliers) }, [suppliers])
  useEffect(() => { save(K.settings, settings) }, [settings])

  // Prototype event log (capture route, payee check, L2, L3 …), tagged with the current respondent ID.
  const logEvent = useCallback((type, data) => {
    setEvents((ev) => [...ev, { at: new Date().toISOString(), respondent, type, ...data }])
  }, [respondent])

  const addBill = useCallback((bill) => {
    const id = 'u' + Date.now().toString(36)
    setBills((b) => [{ payments: [], ...bill, id }, ...b])
    return id
  }, [])

  const updateBill = useCallback((id, patch) => {
    setBills((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }, [])

  /** Owner-confirmed payment (full or part). Returns true when the bill is now fully paid. */
  const recordPayment = useCallback((id, { amount, how }) => {
    const at = new Date().toISOString()
    const bill = bills.find((x) => x.id === id)
    if (!bill) return false
    const payments = [...(bill.payments || []), { amount: Number(amount), at, how }]
    const full = payments.reduce((s, p) => s + p.amount, 0) >= Number(bill.amount) - 0.5
    setBills((list) => list.map((x) => (x.id === id ? { ...x, payments, ...(full ? { status: 'paid', paidAt: at } : {}) } : x)))
    return full
  }, [bills])

  const addSupplier = useCallback((s) => {
    setSuppliers((list) => [...list.filter((x) => x.name.toLowerCase() !== s.name.toLowerCase()), { ...s, addedAt: new Date().toISOString() }])
  }, [])

  const resetDemo = useCallback(() => { setBills(seedBills()) }, [])

  const value = useMemo(() => ({
    bills, addBill, updateBill, recordPayment, resetDemo, events, logEvent, setEvents, respondent, setRespondent,
    suppliers, addSupplier, settings, setSettings,
  }), [bills, addBill, updateBill, recordPayment, resetDemo, events, logEvent, respondent, suppliers, addSupplier, settings])

  return <Store.Provider value={value}>{children}</Store.Provider>
}

export const useStore = () => useContext(Store)
