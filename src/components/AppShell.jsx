import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRole } from '../hooks/useRole'
import { supabase } from '../lib/supabase'

export default function AppShell() {
  const { session, loading: authLoading } = useAuth()
  const { isExecutor } = useRole(session?.user?.id)

  if (authLoading) return null

  if (!session) return <Navigate to="/auth" replace />

  return (
    <>
      <nav>
        <NavLink to="/messages">Messages</NavLink>
        <NavLink to="/executors">Executors</NavLink>
        {isExecutor && <NavLink to="/executor">Executor Dashboard</NavLink>}
        <button onClick={() => supabase.auth.signOut()}>Sign out</button>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  )
}
