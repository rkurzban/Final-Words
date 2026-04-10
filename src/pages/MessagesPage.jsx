import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DEMO_MESSAGES } from '../lib/demoData'

const STATUS_LABEL = {
  draft:     'Draft',
  active:    'Active',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function MessagesPage() {
  const { session } = useAuth()
  const [messages, setMessages] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!session) {
      setMessages(DEMO_MESSAGES)
      return
    }

    supabase
      .from('messages')
      .select('id, recipient_name, subject, delivery_type, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setMessages(data)
      })
  }, [session])

  return (
    <div className="messages-page">
      <div className="page-header">
        <h2>Your messages</h2>
        <Link to="/messages/new" className="btn-primary">+ New message</Link>
      </div>

      {error && <p className="error">{error}</p>}

      {messages === null && !error && <p className="loading">Loading…</p>}

      {messages !== null && messages.length === 0 && (
        <p className="empty">
          No messages yet.{' '}
          <Link to="/messages/new">Write your first one.</Link>
        </p>
      )}

      {messages !== null && messages.length > 0 && (
        <ul className="message-list">
          {messages.map((msg) => (
            <li key={msg.id}>
              <Link to={`/messages/${msg.id}`} className="message-row">
                <span className="message-recipient">{msg.recipient_name}</span>
                <span className="message-subject">
                  {msg.subject || <em>No subject</em>}
                </span>
                <span className="message-type">
                  {msg.delivery_type === 'one_time' ? 'One-time' : 'Recurring'}
                </span>
                <span className={`status-badge status-${msg.status}`}>
                  {STATUS_LABEL[msg.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
