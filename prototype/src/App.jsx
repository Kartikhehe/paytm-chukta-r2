import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Inbox from './screens/Inbox.jsx'

// Everything except the inbox loads on demand, so a cheap phone on 4G opens the app fast.
const Capture = lazy(() => import('./screens/Capture.jsx'))
const Confirm = lazy(() => import('./screens/Confirm.jsx'))
const BillDetail = lazy(() => import('./screens/BillDetail.jsx'))
const SupplierNew = lazy(() => import('./screens/SupplierNew.jsx'))
const Payee = lazy(() => import('./screens/Payee.jsx'))
const Pay = lazy(() => import('./screens/Pay.jsx'))
const Later = lazy(() => import('./screens/Later.jsx'))
const Soundbox = lazy(() => import('./screens/Soundbox.jsx'))
const Collect = lazy(() => import('./screens/Collect.jsx'))
const FieldLog = lazy(() => import('./screens/FieldLog.jsx'))

const Loading = () => (
  <div className="grid min-h-dvh place-items-center bg-bg">
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-sky border-t-cyan" aria-label="Loading" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Inbox />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/confirm" element={<Confirm />} />
        <Route path="/bill/:id" element={<BillDetail />} />
        <Route path="/supplier/new" element={<SupplierNew />} />
        <Route path="/payee/:id" element={<Payee />} />
        <Route path="/pay/:id" element={<Pay />} />
        <Route path="/later/:id" element={<Later />} />
        <Route path="/soundbox" element={<Soundbox />} />
        <Route path="/collect" element={<Collect />} />
        <Route path="/log" element={<FieldLog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
