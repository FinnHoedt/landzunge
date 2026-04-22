import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Layout({ children }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-[200px] bg-slate-800 text-slate-300 p-6 flex-shrink-0 flex flex-col">
        <h1 className="text-xs font-semibold text-white mb-6 tracking-widest uppercase">Landzunge</h1>
        <nav className="flex flex-col gap-1">
          <NavLink
            to="/guestbook"
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`
            }
          >
            Guestbook
          </NavLink>
          <NavLink
            to="/dispatches"
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${isActive ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`
            }
          >
            Dispatches
          </NavLink>
        </nav>
        <div className="mt-auto pt-6">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-slate-400 border border-slate-600 rounded px-3 py-2 hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
