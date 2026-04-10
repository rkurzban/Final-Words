import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function ExecutorDashboard() {
  const { session } = useAuth()
  const [assignments, setAssignments] = useState(null)
  const [error, setError] = useState(null)
  // confirmState: null | { executorId, authorId, step: 1 | 2 }
  const [confirmState, setConfirmState] = useState(null)
  const [registering, setRegistering] = useState(false)
  // Track registrations made this session (executor.id → true)
  const [registered, setRegistered] = useState({})

  useEffect(() => {
    if (!session) return
    load()
  }, [session])

  async function load() {
    // Step 1: fetch executor records for this user
    const { data: exRows, error: exErr } = await supabase
      .from('executors')
      .select('id, author_id, is_backup, accepted_at')
      .eq('executor_user_id', session.user.id)
      .order('is_backup', { ascending: true })

    if (exErr) { setError(exErr.message); return }
    if (exRows.length === 0) { setAssignments([]); return }

    // Step 2: fetch author profiles (allowed by the executor profile policy)
    const authorIds = exRows.map((r) => r.author_id)
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds)

    if (pErr) { setError(pErr.message); return }

    const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))
    setAssignments(exRows.map((ex) => ({ ...ex, author: profileMap[ex.author_id] ?? null })))
  }

  async function confirmDeath(executorId, authorId) {
    setRegistering(true)
    setError(null)
    const { error } = await supabase.from('death_registrations').insert({
      author_id: authorId,
      registered_by_executor_id: executorId,
    })
    if (error) {
      setError(error.message)
    } else {
      setRegistered((prev) => ({ ...prev, [executorId]: true }))
      setConfirmState(null)
    }
    setRegistering(false)
  }

  return (
    <div className="executor-dashboard">
      <h2>Executor dashboard</h2>
      <p className="page-desc">
        You are designated as an executor for the people listed below. When an author dies,
        use this dashboard to register their death and trigger message delivery.
      </p>

      {error && <p className="error">{error}</p>}
      {assignments === null && !error && <p className="loading">Loading…</p>}

      {assignments !== null && assignments.length === 0 && (
        <p className="empty">You are not currently designated as an executor for anyone.</p>
      )}

      {assignments !== null && assignments.length > 0 && (
        <ul className="executor-assignment-list">
          {assignments.map((ex) => {
            const isRegistered = registered[ex.id]
            const isConfirming = confirmState?.executorId === ex.id
            const authorName = ex.author?.full_name ?? 'Unknown author'

            return (
              <li key={ex.id} className="assignment-row">
                <div className="assignment-info">
                  <span className="assignment-author">{authorName}</span>
                  <span className={`role-badge ${ex.is_backup ? 'role-backup' : 'role-primary'}`}>
                    {ex.is_backup ? 'Backup executor' : 'Primary executor'}
                  </span>
                  {!ex.accepted_at && (
                    <span className="status-badge status-draft">Invite pending</span>
                  )}
                </div>

                {isRegistered ? (
                  <p className="registration-confirmed">
                    Death registered. The 72-hour grace period has begun.
                  </p>
                ) : isConfirming && confirmState.step === 1 ? (
                  <div className="confirm-step">
                    <p>
                      You are about to register the death of <strong>{authorName}</strong>.
                      This will start a 72-hour grace period before messages are delivered.
                    </p>
                    <div className="confirm-actions">
                      <button
                        className="btn-danger"
                        onClick={() => setConfirmState({ executorId: ex.id, authorId: ex.author_id, step: 2 })}
                      >
                        Yes, continue
                      </button>
                      <button onClick={() => setConfirmState(null)}>Cancel</button>
                    </div>
                  </div>
                ) : isConfirming && confirmState.step === 2 ? (
                  <div className="confirm-step">
                    <p>
                      <strong>Final confirmation.</strong> Registering the death of{' '}
                      <strong>{authorName}</strong> cannot be undone by you. The author will
                      receive a kill-switch link to cancel within 72 hours.
                    </p>
                    <div className="confirm-actions">
                      <button
                        className="btn-danger"
                        disabled={registering}
                        onClick={() => confirmDeath(ex.id, ex.author_id)}
                      >
                        {registering ? 'Registering…' : 'Confirm death registration'}
                      </button>
                      <button onClick={() => setConfirmState(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn-danger-subtle"
                    onClick={() => setConfirmState({ executorId: ex.id, authorId: ex.author_id, step: 1 })}
                  >
                    Register death
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
