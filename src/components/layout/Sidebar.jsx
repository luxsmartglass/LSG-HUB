import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const NAV = [
  { path:'/', label:'Home', icon:<HomeIcon /> },
  { path:'/pipeline', label:'Pipeline', icon:<PipelineIcon /> },
  { path:'/estimates', label:'All Estimates', icon:<ListIcon /> },
  { path:'/estimator', label:'New Estimate', icon:<PlusIcon /> },
  { path:'/contacts', label:'Contacts', icon:<UsersIcon /> },
  { path:'/invoices', label:'Invoices', icon:<InvoiceIcon /> },
  { path:'/products', label:'Products', icon:<ProductIcon /> },
  { path:'/settings', label:'Settings', icon:<SettingsIcon /> },
]

export default function Sidebar({ session }) {
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const user = session?.user
  const initials = user?.user_metadata?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'LSG'

  return (
    <div style={{
      width:220, minWidth:220, background:'#1c2b4a', display:'flex',
      flexDirection:'column', height:'100vh', position:'relative', zIndex:10
    }}>
      {/* Logo */}
      <div style={{ padding:'28px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'#c9a84c', letterSpacing:2 }}>LSG</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:1.5, textTransform:'uppercase', marginTop:3 }}>Lux Smart Glass</div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 0' }}>
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10, padding:'11px 20px',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.88)',
              background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
              borderLeft: isActive ? '3px solid #c9a84c' : '3px solid transparent',
              fontWeight: isActive ? 500 : 400,
              fontSize:13.5, textDecoration:'none',
              transition:'all 0.15s',
            })}
            onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background='rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background='transparent' }}
          >
            <span style={{ opacity:0.75, display:'flex', flexShrink:0 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} style={{ width:28, height:28, borderRadius:'50%' }} alt="avatar" />
            : <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#c9a84c' }}>{initials}</div>
          }
          <div>
            <div style={{ fontSize:12.5, fontWeight:600, color:'rgba(255,255,255,0.8)' }}>{user?.user_metadata?.full_name || 'LSG'}</div>
            <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)' }}>Lux Smart Glass</div>
          </div>
        </div>
        <button onClick={signOut} style={{
          width:'100%', padding:'7px 12px', background:'rgba(255,255,255,0.06)',
          border:'1px solid rgba(255,255,255,0.1)', borderRadius:6,
          color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer',
          fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
        >Sign Out</button>
      </div>
    </div>
  )
}

function HomeIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function PipelineIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="16" rx="1"/></svg> }
function PlusIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function InvoiceIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function ProductIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="6" height="6"/><rect x="9" y="3" width="6" height="6"/><rect x="16" y="3" width="6" height="6"/><rect x="2" y="10" width="6" height="11"/><rect x="9" y="10" width="13" height="5"/><rect x="9" y="17" width="13" height="4"/></svg> }
function SettingsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function ListIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
