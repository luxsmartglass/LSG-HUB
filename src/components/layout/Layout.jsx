import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useTheme } from '../../theme/useTheme'

export default function Layout({ children, session }) {
  const { c } = useTheme()
  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden' }}>
      <Sidebar session={session} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar session={session} />
        <main id="content" style={{ flex:1, overflowY:'auto', padding:28, background:c.bg, color:c.textPrimary, transition:'background-color 0.25s ease, color 0.25s ease' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
