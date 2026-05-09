import { useLocation, useNavigate } from 'react-router-dom'

const TITLES = {
  '/': 'Home',
  '/pipeline': 'Pipeline',
  '/estimator': 'New Estimate',
  '/contacts': 'Contacts',
  '/invoices': 'Invoices',
  '/products': 'Product Catalog',
  '/settings': 'Settings',
}

export default function Topbar({ session }) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = TITLES[location.pathname] || 'LSG Hub'
  const isEstimator = location.pathname.startsWith('/estimator')

  return (
    <div style={{
      height:56, minHeight:56, background:'#1c2b4a',
      borderBottom:'1px solid rgba(255,255,255,0.08)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 28px', boxShadow:'0 1px 8px rgba(0,0,0,0.3)'
    }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:600, color:'#f4f1eb' }}>{title}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span id="sync-indicator" style={{ fontSize:12, color:'#9ca3af', transition:'color 0.2s' }} />
        {!isEstimator && (
          <button
            onClick={() => navigate('/estimator')}
            style={{
              display:'flex', alignItems:'center', gap:6, padding:'9px 18px',
              background:'#c9a84c', color:'#1c2b4a', border:'none', borderRadius:7,
              fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
              transition:'background 0.15s'
            }}
            onMouseEnter={e=>e.currentTarget.style.background='#a8883c'}
            onMouseLeave={e=>e.currentTarget.style.background='#c9a84c'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Estimate
          </button>
        )}
      </div>
    </div>
  )
}
