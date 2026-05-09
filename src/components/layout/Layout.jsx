import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children, session }) {
  return (
    <div style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden' }}>
      <Sidebar session={session} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar session={session} />
        <main id="content" style={{ flex:1, overflowY:'auto', padding:28, background:'#0f1d35' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
