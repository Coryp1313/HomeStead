/**
 * Homestead — Notification Panel
 *
 * Shows in-app notifications for:
 *   - Order confirmations (buyer)
 *   - New messages from sellers
 *   - Boost expiry reminders (seller)
 *   - Plan upgrade prompts
 *
 * Bell icon lives in the nav. Red dot appears when there are unread items.
 */

import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const TYPE_STYLES = {
  order:   { bg: '#EAF3DE', color: '#27500A', icon: '✅' },
  message: { bg: '#E6F1FB', color: '#185FA5', icon: '💬' },
  boost:   { bg: '#EEEDFE', color: '#534AB7', icon: '⚡' },
  plan:    { bg: '#FAEEDA', color: '#633806', icon: '⭐' },
  system:  { bg: '#f1f0eb', color: '#555',    icon: '🔔' },
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function NotificationPanel() {
  const { notifications, markAllRead, unreadCount } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    setOpen(o => !o)
    if (!open && unreadCount > 0) {
      // Small delay so user sees the unread state before marking read
      setTimeout(markAllRead, 1200)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        style={{
          width: 36, height: 36, borderRadius: 8,
          border: '0.5px solid rgba(0,0,0,0.12)',
          background: open ? '#EAF3DE' : 'transparent',
          cursor: 'pointer', fontSize: 17,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 5, right: 5,
            width: 14, height: 14, borderRadius: '50%',
            background: '#E24B4A', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid #fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 320, maxHeight: 420,
          background: '#fff', borderRadius: 14,
          border: '0.5px solid rgba(0,0,0,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 500, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                style={{ fontSize: 12, color: '#3B6D11', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#888', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>All quiet for now</div>
                <div style={{ fontSize: 12 }}>You'll see order confirmations, messages, and updates here.</div>
              </div>
            ) : (
              notifications.map(n => {
                const ts = TYPE_STYLES[n.type] ?? TYPE_STYLES.system
                return (
                  <div key={n.id} style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
                    background: n.read ? 'transparent' : '#fafffe',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: ts.bg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16,
                    }}>
                      {ts.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 500, marginBottom: 2, color: '#1a1a18' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.45, marginBottom: 4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    {!n.read && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3B6D11', flexShrink: 0, marginTop: 5 }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
