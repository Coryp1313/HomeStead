/**
 * Homestead — App Context
 *
 * Accounts and listings now live in Supabase (see supabase/schema.sql).
 * Supabase keeps people signed in across visits on its own.
 *
 * Cart, orders and notifications are still kept in this browser's
 * localStorage for now.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase, toListing, toSeller, LISTING_SELECT } from '../lib/supabase'

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

const SIGNED_OUT = { id: null, name: '', email: '', seller: null }
const GUEST      = { id: 'guest', name: 'Guest', email: '', seller: null, isGuest: true }

// ─────────────────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  // Signed-in account (or guest / signed out). authReady is false until
  // Supabase has told us whether someone is already signed in.
  const [user, setUser]           = useState(() => load('guest', false) ? GUEST : SIGNED_OUT)
  const [authReady, setAuthReady] = useState(false)

  // Every active listing in the marketplace, from the database
  const [listings, setListings]           = useState([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [listingsError, setListingsError] = useState(null)

  // Cart — persisted so items survive refresh
  const [cart, setCartRaw] = useState(() => load('cart', []))

  // Orders — persisted
  const [orders, setOrdersRaw] = useState(() => load('orders', []))

  // Notifications — persisted
  const [notifications, setNotificationsRaw] = useState(() => load('notifications', []))

  // True after someone clicks a "reset your password" email link
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  // ── Persist helpers ─────────────────────────────────────────────────────────

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

  // ── Accounts ────────────────────────────────────────────────────────────────

  /**
   * Loads the signed-in person's profile and seller row (if they sell).
   */
  const loadAccount = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(load('guest', false) ? GUEST : SIGNED_OUT)
      return
    }
    const [{ data: profile }, { data: sellerRow }] = await Promise.all([
      supabase.from('profiles').select('name, email').eq('id', authUser.id).maybeSingle(),
      supabase.from('sellers').select('*').eq('user_id', authUser.id).maybeSingle(),
    ])
    clear('guest')
    setUser({
      id:     authUser.id,
      name:   profile?.name || authUser.user_metadata?.name || authUser.email.split('@')[0],
      email:  authUser.email,
      seller: toSeller(sellerRow),
    })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      await loadAccount(data.session?.user ?? null)
      setAuthReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Run outside the auth callback, as Supabase recommends
        setTimeout(() => loadAccount(session?.user ?? null), 0)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [loadAccount])

  /**
   * Creates an account. If email confirmation is turned on in Supabase,
   * there's no session yet and the person must click the link we email them.
   */
  const signUp = useCallback(async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }, [])

  const enterAsGuest = useCallback(() => {
    save('guest', true)
    setUser(GUEST)
  }, [])

  /** Leaves guest mode and goes back to the landing page to sign up / log in */
  const leaveGuest = useCallback((mode = 'signup') => {
    clear('guest')
    window.location.replace(`/?${mode}=1`)
  }, [])

  /** Re-reads the seller row, e.g. after onboarding or a plan change */
  const refreshSeller = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    await loadAccount(data.user ?? null)
  }, [loadAccount])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    clear('guest')
    clear('cart')
    clear('orders')
    clear('notifications')
    setUser(SIGNED_OUT)
    setCartRaw([])
    setOrdersRaw([])
    setNotificationsRaw([])
  }, [])

  // ── Listings ────────────────────────────────────────────────────────────────

  const reloadListings = useCallback(async () => {
    setListingsError(null)
    const { data, error } = await supabase
      .from('listings')
      .select(LISTING_SELECT)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Could not load listings:', error)
      setListingsError('Could not load listings. Please refresh the page.')
    } else {
      setListings(data.map(toListing))
    }
    setListingsLoading(false)
  }, [])

  useEffect(() => { reloadListings() }, [reloadListings, user.id])

  /**
   * Adds a listing for the signed-in seller. `fields` uses database names
   * (name, price, unit, category, ...).
   */
  const addListing = useCallback(async (fields) => {
    if (!user.seller) throw new Error('Set up your seller account first.')
    const { data, error } = await supabase
      .from('listings')
      .insert({ ...fields, seller_id: user.seller.id })
      .select(LISTING_SELECT)
      .single()
    if (error) throw error
    setListings(ls => [toListing(data), ...ls])
    return toListing(data)
  }, [user.seller])

  const updateListing = useCallback(async (listingId, fields) => {
    const { data, error } = await supabase
      .from('listings')
      .update(fields)
      .eq('id', listingId)
      .select(LISTING_SELECT)
      .single()
    if (error) throw error
    setListings(ls => ls.map(l => l.id === listingId ? toListing(data) : l))
  }, [])

  const deleteListing = useCallback(async (listingId) => {
    const { error } = await supabase.from('listings').delete().eq('id', listingId)
    if (error) throw error
    setListings(ls => ls.filter(l => l.id !== listingId))
    setCart(c => c.filter(i => i.id !== listingId))
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
      user, authReady, signUp, signIn, resetPassword, logout,
      enterAsGuest, leaveGuest, refreshSeller,
      listings, listingsLoading, listingsError, reloadListings,
      addListing, updateListing, deleteListing,
      cart, addToCart, removeFromCart, clearCart,
      orders, addOrder,
      notifications, addNotification, markAllRead, unreadCount,
      toast, showToast,
    }}>
      {children}
      {passwordRecovery && (
        <NewPasswordModal
          onDone={() => { setPasswordRecovery(false); showToast('Password updated', 'success') }}
        />
      )}
      {toast && <Toast toast={toast} />}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

function NewPasswordModal({ onDone }) {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,33,3,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 18, padding: '1.75rem', maxWidth: 380, width: '100%', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 6px' }}>Choose a new password</h2>
        <p style={{ fontSize: 13, color: '#777', margin: '0 0 16px' }}>You'll use this to log in from now on.</p>
        <input type="password" autoFocus value={password} onChange={e => { setPassword(e.target.value); setError(null) }}
          placeholder="At least 6 characters"
          style={{ width: '100%', padding: '12px 13px', borderRadius: 9, border: '0.5px solid rgba(0,0,0,.2)', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }} />
        {error && <div style={{ background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '9px 13px', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={saving}
          style={{ width: '100%', padding: '13px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </div>
  )
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
