import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DEMO_EXECUTORS } from '../lib/demoData'

const EMPTY_FORM = { name: '', email: '', is_backup: false }

export default function ExecutorsPage() {
  const { session } = useAuth()
  const isDemo = !session

  const [executors, setExecutors] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  useEffect(() => {
    if (isDemo) {
      setExecutors(DEMO_EXECUTORS)
      return
    }
    load()
  }, [session])

  async function load() {
    const { data, error } = await supabase
      .from('executors')
      .select('id, name, email, is_backup, invite_sent_at, accepted_at')
      .order('is_backup', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) setFetchError(error.message)
    else setExecutors(data)
  }

  function addField(name) {
    return (e) => setAddForm((prev) => ({ ...prev, [name]: e.target.value }))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setAdding(true)
    setAddError(null)
    const { error } = await supabase.from('executors').insert({
      author_id: session.user.id,
      name: addForm.name,
      email: addForm.email,
      is_backup: addForm.is_backup,
    })
    if (error) {
      setAddError(error.message)
      setAdding(false)
    } else {
      setAddForm(EMPTY_FORM)
      setShowAdd(false)
      setAdding(false)
      load()
    }
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove ${name} as an executor?`)) return
    const { error } = await supabase.from('executors').delete().eq('id', id)
    if (error) setFetchError(error.message)
    else load()
  }

  return (
    <div className="executors-page">
      <div className="page-header">
        <h2>Executors</h2>
        {!isDemo && (
          <button className="btn-primary" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Cancel' : '+ Add executor'}
          </button>
        )}
      </div>

      <p className="page-desc">
        Executors are trusted people who will confirm your death and trigger delivery of your
        messages. Designate at least one primary executor and optionally a backup.
      </p>

      {!isDemo && showAdd && (
        <form onSubmit={handleAdd} className="add-form">
          <h3>Add executor</h3>
          {addError && <p className="error">{addError}</p>}
          <div className="field">
            <label htmlFor="ex-name">Name</label>
            <input
              id="ex-name"
              type="text"
              value={addForm.name}
              onChange={addField('name')}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="ex-email">Email</label>
            <input
              id="ex-email"
              type="email"
              value={addForm.email}
              onChange={addField('email')}
              required
            />
          </div>
          <div className="field field-check">
            <label>
              <input
                type="checkbox"
                checked={addForm.is_backup}
                onChange={(e) => setAddForm((p) => ({ ...p, is_backup: e.target.checked }))}
              />
              Backup executor
            </label>
          </div>
          <button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add executor'}
          </button>
        </form>
      )}

      {fetchError && <p className="error">{fetchError}</p>}
      {executors === null && !fetchError && <p className="loading">Loading…</p>}

      {executors !== null && executors.length === 0 && (
        <p className="empty">
          No executors yet. Add at least one primary executor so your messages can be delivered.
        </p>
      )}

      {executors !== null && executors.length > 0 && (
        <ul className="executor-list">
          {executors.map((ex) => (
            <li key={ex.id} className="executor-row">
              <div className="executor-info">
                <span className="executor-name">{ex.name}</span>
                <span className="executor-email">{ex.email}</span>
                <span className={`role-badge ${ex.is_backup ? 'role-backup' : 'role-primary'}`}>
                  {ex.is_backup ? 'Backup' : 'Primary'}
                </span>
                <span className={`status-badge ${ex.accepted_at ? 'status-active' : 'status-draft'}`}>
                  {ex.accepted_at ? 'Accepted' : 'Pending'}
                </span>
              </div>
              {!isDemo && (
                <button className="btn-danger-subtle" onClick={() => handleRemove(ex.id, ex.name)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
