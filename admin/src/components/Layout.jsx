import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Layout({ children }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>LANDZUNGE</h1>
        <nav>
          <NavLink to="/guestbook" className={({ isActive }) => isActive ? 'active' : ''}>
            Guestbook
          </NavLink>
          <NavLink to="/dispatches" className={({ isActive }) => isActive ? 'active' : ''}>
            Dispatches
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
