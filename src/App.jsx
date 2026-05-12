import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './components/dashboard/Dashboard'
import Estimator from './components/estimator/Estimator'
import EstimateList from './components/estimator/EstimateList'
import Pipeline from './components/pipeline/Pipeline'
import Contacts from './components/contacts/Contacts'
import Invoices from './components/invoices/Invoices'
import Products from './components/products/Products'
import Settings from './components/settings/Settings'
import Splash from './components/Splash'
import { ToastProvider } from './components/ui/Toast'
import { useTheme } from './theme/useTheme'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

function FullScreenBrand({ label }) {
  const { c } = useTheme()
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:c.bg }}>
      <div style={{ fontFamily:c.font.heading, fontSize:48, fontWeight:c.weight.hero, color:c.accent, letterSpacing:8 }}>LSG</div>
      {label && <span style={{ marginLeft:16, color:c.textMuted, fontFamily:c.font.body }}>{label}</span>}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [showSplash, setShowSplash] = useState(!sessionStorage.getItem('lsg_splash_seen'))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return <FullScreenBrand />

  if (showSplash) return (
    <ToastProvider>
      <Splash onComplete={() => { sessionStorage.setItem('lsg_splash_seen','1'); setShowSplash(false) }} />
    </ToastProvider>
  )

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/*" element={
          <ProtectedRoute session={session}>
            <Layout session={session}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/estimator" element={<Estimator />} />
                <Route path="/estimator/:id" element={<Estimator />} />
                <Route path="/estimates" element={<EstimateList />} />
                <Route path="/pipeline" element={<Pipeline />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/products" element={<Products />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </ToastProvider>
  )
}

function AuthCallback() {
  useEffect(() => {
    sessionStorage.removeItem('lsg_splash_seen')
    supabase.auth.exchangeCodeForSession(window.location.href).then(() => {
      window.location.href = '/'
    })
  }, [])
  return <FullScreenBrand label="Signing in…" />
}
