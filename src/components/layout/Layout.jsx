import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import PageTransition from '../ui/PageTransition'
import { useTheme } from '../../theme/useTheme'
import { useIsMobile } from '../../hooks/useMediaQuery'

export default function Layout({ children, session }) {
  const { c } = useTheme()
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden' }}>
      {isMobile ? (
        <>
          {drawerOpen && (
            <div onClick={() => setDrawerOpen(false)}
                 style={{ position:'fixed', inset:0, background:c.overlay, zIndex:999 }} />
          )}
          <div style={{
            position:'fixed', top:0, bottom:0, left:0, zIndex:1000,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition:'transform .25s ease',
          }}>
            <Sidebar session={session} isMobile open={drawerOpen}
                     onNavigate={() => setDrawerOpen(false)}
                     onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      ) : (
        <Sidebar session={session} />
      )}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar session={session} isMobile={isMobile} onMenu={() => setDrawerOpen(true)} />
        <main id="content" style={{
          flex:1, overflowY:'auto', padding: isMobile ? 16 : 28,
          background:c.bg, color:c.textPrimary,
          transition:'background-color 0.25s ease, color 0.25s ease',
        }}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
