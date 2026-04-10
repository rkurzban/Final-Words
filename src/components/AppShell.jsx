import { NavLink, Outlet, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'

// Set to true to re-enable the sign-in gate
const AUTH_REQUIRED = false

export default function AppShell() {
  const { session, loading: authLoading } = useAuth()
  const { isExecutor } = useRole(session?.user?.id)

  if (AUTH_REQUIRED) {
    if (authLoading) return null
    if (!session) return <Navigate to="/auth" replace />
  }

  return (
    <>
      <nav>
        <Link to="/messages" className="nav-brand">Final Words</Link>
        <NavLink to="/messages">Messages</NavLink>
        <NavLink to="/executors">Executors</NavLink>
        {isExecutor && <NavLink to="/executor">Executor Dashboard</NavLink>}
        {session && (
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  )
}
