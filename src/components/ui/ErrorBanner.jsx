export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null
  return (
    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, margin:'16px 0' }}>
      <span style={{ color:'#dc2626', fontFamily:'DM Sans,sans-serif', fontSize:14 }}>⚠️ {typeof error === 'string' ? error : error.message || 'Something went wrong'}</span>
      {onRetry && <button onClick={onRetry} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:13 }}>Retry</button>}
    </div>
  )
}
