export default function EmptyState({ icon = '📋', title, message, action, onAction }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'#9ca3af' }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:'#4b5563', marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:14, marginBottom:20 }}>{message}</div>
      {action && (
        <button onClick={onAction} style={{ padding:'9px 18px', background:'#c9a84c', color:'#1c2b4a', border:'none', borderRadius:7, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          {action}
        </button>
      )}
    </div>
  )
}
