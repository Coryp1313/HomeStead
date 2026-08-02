/**
 * Homestead — App Context (with localStorage session persistence)
 *
 * Fixes the blank dashboard by persisting seller session in localStorage
 * so the dashboard stays populated after sign-up and page refresh.
 *
 * Also stores cart and orders across sessions.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext(null)

// ── localStorage helpers ──────────────────────────────────────────────────────

function load(key, fallback) {
  try {
    const v = localStorage.getItem('homestead_' + key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key, value) {
  try { localStorage.setItem('homestead_' + key, JSON.stringify(value)) } catch {}
}

function clear(key) {
  try { localStorage.removeItem('homestead_' + key) } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  // User — persisted so dashboard survives page refresh
  const [user, setUserRaw] = useState(() => load('user', {
    id:     null,
    name:   '',
    email:  '',
    seller: null,   // populated after seller onboarding completes
  }))

  // Cart — persisted so items survive refresh
  const [cart, setCartRaw] = useState(() => load('cart', []))

  // Orders — persisted
  const [orders, setOrdersRaw] = useState(() => load('orders', []))

  // Notifications — persisted
  const [notifications, setNotificationsRaw] = useState(() => load('notifications', []))

  // Toast
  const [toast, setToast] = useState(null)

  // ── Persist helpers ─────────────────────────────────────────────────────────

  function setUser(u) { setUserRaw(u); save('user', u) }
  function setCart(fn) {
    setCartRaw(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      save('cart', next)
      return next
    })
  }
  function setOrders(fn) {
    setOrdersRaw(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      save('orders', next)
      return next
    })
  }
  function setNotifications(fn) {
    setNotificationsRaw(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn
      save('notifications', next)
      return next
    })
  }

  // ── Auth helpers ────────────────────────────────────────────────────────────

  /**
   * Call this after the seller onboarding form is submitted.
   * Saves their name, email, and sellerId so the dashboard
   * shows their info immediately after Stripe redirects back.
   */
  const registerSeller = useCallback(({ name, email, sellerId, stripeAccountId, businessName }) => {
    const updated = {
      id:    sellerId,
      name,
      email,
      seller: {
        id:              sellerId,
        businessName,
        stripeAccountId: stripeAccountId ?? null,
        plan:            'sprout',
        planStatus:      'active',
        stripeCustomerId: null,
        joinedAt:        new Date().toISOString(),
      }
    }
    setUser(updated)
    return updated
  }, [])

  /**
   * Call this after a subscription checkout succeeds
   * (e.g. on the /seller/subscription/success page).
   */
  const upgradePlan = useCallback((plan, stripeCustomerId) => {
    setUser(u => {
      const updated = {
        ...u,
        seller: { ...u.seller, plan, planStatus: 'trialing', stripeCustomerId }
      }
      save('user', updated)
      return updated
    })
  }, [])

  /**
   * Update the seller's Stripe account ID after onboarding completes.
   */
  const setStripeAccountId = useCallback((stripeAccountId) => {
    setUser(u => {
      const updated = { ...u, seller: { ...u.seller, stripeAccountId } }
      save('user', updated)
      return updated
    })
  }, [])

  const logout = useCallback(() => {
    clear('user')
    clear('cart')
    clear('orders')
    clear('notifications')
    setUserRaw({ id: null, name: '', email: '', seller: null })
    setCartRaw([])
    setOrdersRaw([])
    setNotificationsRaw([])
  }, [])

  // ── Cart helpers ────────────────────────────────────────────────────────────

  const addToCart = useCallback((listing) => {
    setCart(c => {
      if (c.find(i => i.id === listing.id)) return c
      return [...c, listing]
    })
    showToast(`${listing.name} added to cart`, 'success')
  }, [])

  const removeFromCart = useCallback((listingId) => {
    setCart(c => c.filter(i => i.id !== listingId))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  // ── Order helpers ───────────────────────────────────────────────────────────

  const addOrder = useCallback((listing) => {
    const order = {
      id:        `order_${Date.now()}`,
      listing,
      status:    'awaiting_pickup',
      createdAt: new Date().toISOString(),
    }
    setOrders(o => [order, ...o])
    clearCart()
    // Add a notification for the buyer
    addNotification({
      type:    'order',
      title:   'Order placed',
      message: `Your order for ${listing.name} from ${listing.seller?.name} is confirmed. Message them to arrange pickup.`,
      listingId: listing.id,
    })
  }, [clearCart])

  // ── Notification helpers ────────────────────────────────────────────────────

  const addNotification = useCallback(({ type, title, message, listingId }) => {
    const notif = {
      id:        `notif_${Date.now()}`,
      type,
      title,
      message,
      listingId,
      read:      false,
      createdAt: new Date().toISOString(),
    }
    setNotifications(n => [notif, ...n].slice(0, 50)) // keep last 50
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  // ── Toast ───────────────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  return (
    <AppContext.Provider value={{
      user, setUser, registerSeller, upgradePlan, setStripeAccountId, logout,
      cart, addToCart, removeFromCart, clearCart,
      orders, addOrder,
      notifications, addNotification, markAllRead, unreadCount,
      toast, showToast,
    }}>
      {children}
      {toast && <Toast toast={toast} />}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

function Toast({ toast }) {
  const isError = toast.type === 'error'
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: isError ? '#A32D2D' : '#27500A',
      color: isError ? '#FCEBEB' : '#EAF3DE',
      padding: '10px 20px', borderRadius: 999,
      fontSize: 13, fontWeight: 500,
      zIndex: 9999, whiteSpace: 'nowrap',
      fontFamily: 'system-ui, sans-serif',
      pointerEvents: 'none',
    }}>
      {isError ? '✕ ' : '✓ '}{toast.message}
    </div>
  )
}
