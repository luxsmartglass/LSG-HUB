export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16 }}>
      <div style={{ width:40, height:40, border:'3px solid #1c2b4a', borderTopColor:'#c9a84c', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ color:'#9ca3af', fontFamily:'DM Sans,sans-serif', fontSize:14 }}>{message}</p>
    </div>
  )
}
