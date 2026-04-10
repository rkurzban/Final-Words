import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DEMO_MESSAGES } from '../lib/demoData'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EMPTY_FORM = {
  recipient_name: '',
  recipient_email: '',
  subject: '',
  body: '',
  delivery_type: 'one_time',
  recurring_month: 1,
  recurring_day: 1,
  recurring_years: 1,
}

export default function MessageFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const isEdit = Boolean(id)
  const isDemo = isEdit && id.startsWith('demo-')

  const [form, setForm] = useState(EMPTY_FORM)
  const [msgStatus, setMsgStatus] = useState('draft')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return

    if (isDemo) {
      const msg = DEMO_MESSAGES.find((m) => m.id === id)
      if (msg) {
        setForm({
          recipient_name: msg.recipient_name,
          recipient_email: msg.recipient_email,
          subject: msg.subject ?? '',
          body: msg.body,
          delivery_type: msg.delivery_type,
          recurring_month: msg.recurring_month ?? 1,
          recurring_day: msg.recurring_day ?? 1,
          recurring_years: msg.recurring_years ?? 1,
        })
        setMsgStatus(msg.status)
      }
      setLoading(false)
      return
    }

    supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else {
          setForm({
            recipient_name: data.recipient_name,
            recipient_email: data.recipient_email,
            subject: data.subject ?? '',
            body: data.body,
            delivery_type: data.delivery_type,
            recurring_month: data.recurring_month ?? 1,
            recurring_day: data.recurring_day ?? 1,
            recurring_years: data.recurring_years ?? 1,
          })
          setMsgStatus(data.status)
        }
        setLoading(false)
      })
  }, [id, isEdit, isDemo])

  function field(name) {
    return (e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))
  }

  async function save(newStatus) {
    setSaving(true)
    setError(null)

    const isRecurring = form.delivery_type === 'recurring'
    const payload = {
      recipient_name: form.recipient_name,
      recipient_email: form.recipient_email,
      subject: form.subject || null,
      body: form.body,
      delivery_type: form.delivery_type,
      recurring_month: isRecurring ? Number(form.recurring_month) : null,
      recurring_day:   isRecurring ? Number(form.recurring_day)   : null,
      recurring_years: isRecurring ? Number(form.recurring_years) : null,
      status: newStatus,
    }

    const { error } = isEdit
      ? await supabase.from('messages').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id)
      : await supabase.from('messages').insert(payload)

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      navigate('/messages')
    }
  }

  async function cancelMessage() {
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('messages')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      navigate('/messages')
    }
  }

  const isReadOnly = isDemo || msgStatus === 'delivered' || msgStatus === 'cancelled'

  if (loading) return <p className="loading">Loading…</p>

  return (
    <div className="message-form-page">
      <h2>{isEdit ? 'Edit message' : 'New message'}</h2>

      {isDemo && (
        <p className="form-notice">
          You are viewing a sample message. <a href="/auth">Sign in</a> to create and manage your own.
        </p>
      )}
      {!isDemo && isReadOnly && (
        <p className="form-notice">
          This message is <strong>{msgStatus}</strong> and cannot be edited.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <form onSubmit={(e) => e.preventDefault()} className="message-form">
        <fieldset disabled={isReadOnly || saving}>

          <div className="field">
            <label htmlFor="recipient_name">Recipient name</label>
            <input
              id="recipient_name"
              type="text"
              value={form.recipient_name}
              onChange={field('recipient_name')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="recipient_email">Recipient email</label>
            <input
              id="recipient_email"
              type="email"
              value={form.recipient_email}
              onChange={field('recipient_email')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="subject">
              Subject <span className="optional">(optional)</span>
            </label>
            <input
              id="subject"
              type="text"
              value={form.subject}
              onChange={field('subject')}
            />
          </div>

          <div className="field">
            <label htmlFor="body">Message</label>
            <textarea
              id="body"
              value={form.body}
              onChange={field('body')}
              rows={8}
              required
            />
          </div>

          <div className="field">
            <label>Delivery type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="delivery_type"
                  value="one_time"
                  checked={form.delivery_type === 'one_time'}
                  onChange={field('delivery_type')}
                />
                One-time — sent when you die
              </label>
              <label>
                <input
                  type="radio"
                  name="delivery_type"
                  value="recurring"
                  checked={form.delivery_type === 'recurring'}
                  onChange={field('delivery_type')}
                />
                Recurring — sent annually on a chosen date
              </label>
            </div>
          </div>

          {form.delivery_type === 'recurring' && (
            <div className="field">
              <label>Send annually on</label>
              <div className="recurring-row">
                <select
                  value={form.recurring_month}
                  onChange={field('recurring_month')}
                  aria-label="Month"
                >
                  {MONTHS.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={form.recurring_day}
                  onChange={field('recurring_day')}
                  min={1}
                  max={31}
                  aria-label="Day"
                />
                <span>for</span>
                <select
                  value={form.recurring_years}
                  onChange={field('recurring_years')}
                  aria-label="Years"
                >
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>{y} {y === 1 ? 'year' : 'years'}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

        </fieldset>

        {!isReadOnly && (
          <div className="form-actions">
            <button type="button" onClick={() => save('draft')} disabled={saving}>
              Save as draft
            </button>
            <button type="button" className="btn-primary" onClick={() => save('active')} disabled={saving}>
              Activate
            </button>
            {isEdit && msgStatus === 'active' && (
              <button type="button" className="btn-danger" onClick={cancelMessage} disabled={saving}>
                Cancel message
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
