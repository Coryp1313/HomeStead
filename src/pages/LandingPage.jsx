/**
 * Homestead — Landing & Auth Page
 *
 * First thing new visitors see. Has two modes:
 *   - Landing: hero + features, with Sign up / Log in buttons
 *   - Auth modal: sign up or log in form (no real backend needed —
 *     uses localStorage like the rest of the app)
 *
 * Returning users (already in localStorage) are never shown this —
 * App.jsx redirects them straight to the marketplace.
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function LandingPage({ onEnter }) {
  const { setUser } = useApp()
  const [modal, setModal]   = useState(null)  // null | 'login' | 'signup'
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  function field(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    setError(null)
  }

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Basic validation
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }
    if (modal === 'signup' && !form.name.trim()) {
      setError('Please enter your name.')
      setLoading(false)
      return
    }

    // Simulate a brief network call
    await new Promise(r => setTimeout(r, 600))

    // Save user to localStorage — in production replace with real auth
    const user = {
      id:     'user_' + Date.now(),
      name:   modal === 'signup' ? form.name.trim() : form.email.split('@')[0],
      email:  form.email.trim().toLowerCase(),
      seller: null,
    }
    setUser(user)
    setLoading(false)
    onEnter()   // navigate to marketplace
  }

  function browseAsGuest() {
    // Let guests browse without an account
    const guest = {
      id:     'guest_' + Date.now(),
      name:   'Guest',
      email:  '',
      seller: null,
      isGuest: true,
    }
    setUser(guest)
    onEnter()
  }

  return (
    <div style={s.page}>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <div style={s.logoBox}>🌾</div>
          <span style={s.brand}>Homestead</span>
        </div>
        <div style={s.navRight}>
          <button style={s.navLink} onClick={() => { setModal('login'); setError(null) }}>Log in</button>
          <button style={s.navCta}  onClick={() => { setModal('signup'); setError(null) }}>Sign up free</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroPill}>🌿 100% local &amp; organic</div>
          <h1 style={s.heroH}>
            Your neighbor's farm,<br />
            <span style={{ color: '#C0DD97', fontStyle: 'italic' }}>at your fingertips.</span>
          </h1>
          <p style={s.heroSub}>
            Pasture-raised meats, raw honey, heirloom produce, and handcrafted goods —
            grown and made within miles of your door.
          </p>
          <div style={s.heroBtns}>
            <button style={s.heroCtaPrimary} onClick={() => { setModal('signup'); setError(null) }}>
              Get started — it's free
            </button>
            <button style={s.heroCtaSecondary} onClick={browseAsGuest}>
              Browse as guest →
            </button>
          </div>
          <div style={s.heroTrust}>
            {['48 local sellers', '210+ products', 'USDA organic verified', 'Fort Collins, CO'].map(t => (
              <span key={t} style={s.trustPill}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature strip ── */}
      <div style={s.features}>
        {[
          { icon: '📍', title: 'Truly local',      desc: 'Every seller within 25 miles of you. Real farms, real people.' },
          { icon: '🛡️', title: 'Verified sellers', desc: 'Every farm reviewed and certified before listing.' },
          { icon: '🌱', title: 'Always organic',   desc: 'No synthetic pesticides, no GMOs. Ever.' },
          { icon: '💬', title: 'Direct contact',   desc: 'Message sellers directly. Arrange pickup your way.' },
          { icon: '💳', title: 'Secure payments',  desc: 'Stripe-powered checkout. Your card details never touch us.' },
          { icon: '🚜', title: 'Sell your goods',  desc: 'List your farm products and reach hundreds of local buyers.' },
        ].map(f => (
          <div key={f.title} style={s.featCard}>
            <div style={s.featIcon}>{f.icon}</div>
            <div style={s.featTitle}>{f.title}</div>
            <div style={s.featDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Social proof ── */}
      <div style={s.proofSection}>
        <div style={s.proofTitle}>Trusted by local farmers and families</div>
        <div style={s.quotes}>
          {[
            { q: 'I sold out my first batch of eggs in two days. The buyers are serious and local.', name: 'Sarah J.', farm: 'Sunridge Farm' },
            { q: 'Finally a place to find real grass-fed beef without driving 45 minutes.', name: 'Marcus T.', farm: 'Fort Collins buyer' },
            { q: 'Setup was so easy. I listed my honey and had my first order within the week.', name: 'Linda K.', farm: 'Mesa Bees Co.' },
          ].map(({ q, name, farm }) => (
            <div key={name} style={s.quoteCard}>
              <div style={s.quoteText}>"{q}"</div>
              <div style={s.quoteName}>{name}</div>
              <div style={s.quoteFarm}>{farm}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div style={s.bottomCta}>
        <h2 style={s.bottomH}>Ready to shop local?</h2>
        <p style={s.bottomSub}>Join hundreds of families and farmers in Northern Colorado.</p>
        <button style={s.heroCtaPrimary} onClick={() => { setModal('signup'); setError(null) }}>
          Create your free account
        </button>
      </div>

      {/* ── Auth Modal ── */}
      {modal && (
        <div style={s.modalBg} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={s.modalCard}>

            <div style={s.modalHeader}>
              <div style={s.modalLogo}>🌾</div>
              <h2 style={s.modalTitle}>
                {modal === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={s.modalSub}>
                {modal === 'login'
                  ? 'Log in to access your orders and saved items.'
                  : 'Free to join. Browse, buy, or sell local goods.'}
              </p>
            </div>

            <form onSubmit={handleAuth}>
              {modal === 'signup' && (
                <div style={s.formGroup}>
                  <label style={s.label}>Your name</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Sarah Johnson"
                    value={form.name}
                    onChange={e => field('name', e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div style={s.formGroup}>
                <label style={s.label}>Email address</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => field('email', e.target.value)}
                  autoFocus={modal === 'login'}
                />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Password</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder={modal === 'signup' ? 'At least 6 characters' : '••••••••'}
                  value={form.password}
                  onChange={e => field('password', e.target.value)}
                />
              </div>

              {error && <div style={s.errorBox}>{error}</div>}

              <button style={s.authBtn} type="submit" disabled={loading}>
                {loading
                  ? 'One moment…'
                  : modal === 'login' ? 'Log in →' : 'Create account →'}
              </button>
            </form>

            <div style={s.divider}><span>or</span></div>

            <button style={s.guestBtn} onClick={browseAsGuest}>
              Continue as guest (browse only)
            </button>

            <div style={s.switchAuth}>
              {modal === 'login' ? (
                <>Don't have an account? <button style={s.switchLink} onClick={() => { setModal('signup'); setError(null) }}>Sign up free</button></>
              ) : (
                <>Already have an account? <button style={s.switchLink} onClick={() => { setModal('login'); setError(null) }}>Log in</button></>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

// Detect mobile for responsive adjustments
const isMobile = typeof window !== 'undefined' && window.innerWidth < 600

const s = {
  page: { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f5f5f0', minHeight: '100vh', overflowX: 'hidden' },

  nav: { background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.08)', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 54, position: 'sticky', top: 0, zIndex: 100 },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoBox: { width: 30, height: 30, background: '#3B6D11', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 },
  brand: { fontSize: 16, fontWeight: 500, color: '#0f0f0e' },
  navRight: { display: 'flex', alignItems: 'center', gap: 8 },
  navLink: { padding: '6px 10px', background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer', color: '#555', fontFamily: 'inherit' },
  navCta:  { padding: '7px 14px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },

  hero: { background: '#173404', padding: isMobile ? '3rem 1.25rem 2.5rem' : '5rem 1.5rem 4rem' },
  heroInner: { maxWidth: 600, margin: '0 auto', textAlign: 'center' },
  heroPill: { display: 'inline-block', background: 'rgba(151,196,89,0.2)', color: '#C0DD97', fontSize: 11, fontWeight: 500, letterSpacing: 0.6, padding: '4px 12px', borderRadius: 999, border: '0.5px solid rgba(151,196,89,0.3)', marginBottom: 16 },
  heroH: { fontSize: isMobile ? 28 : 42, fontWeight: 500, color: '#f2f7eb', lineHeight: 1.2, letterSpacing: -0.3, marginBottom: 14 },
  heroSub: { fontSize: isMobile ? 14 : 16, color: '#C0DD97', lineHeight: 1.6, marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' },
  heroBtns: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 },
  heroCtaPrimary:   { padding: isMobile ? '12px 22px' : '13px 28px', background: '#EAF3DE', color: '#27500A', border: 'none', borderRadius: 10, fontSize: isMobile ? 14 : 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  heroCtaSecondary: { padding: isMobile ? '12px 18px' : '13px 24px', background: 'transparent', color: '#C0DD97', border: '0.5px solid rgba(192,221,151,0.4)', borderRadius: 10, fontSize: isMobile ? 14 : 15, cursor: 'pointer', fontFamily: 'inherit' },
  heroTrust: { display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' },
  trustPill: { fontSize: 11, color: '#97C459', background: 'rgba(151,196,89,0.12)', padding: '4px 10px', borderRadius: 999, border: '0.5px solid rgba(151,196,89,0.2)' },

  features: { display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: isMobile ? '1.5rem 1rem' : '3rem 1.5rem', maxWidth: 900, margin: '0 auto' },
  featCard: { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '1rem' },
  featIcon: { fontSize: 24, marginBottom: 8 },
  featTitle:{ fontSize: 13, fontWeight: 500, marginBottom: 4 },
  featDesc: { fontSize: 12, color: '#666', lineHeight: 1.5 },

  proofSection: { padding: isMobile ? '1.5rem 1rem 2rem' : '2rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto' },
  proofTitle: { fontSize: 16, fontWeight: 500, textAlign: 'center', marginBottom: 16 },
  quotes: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 },
  quoteCard: { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '1rem' },
  quoteText: { fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' },
  quoteName: { fontSize: 13, fontWeight: 500 },
  quoteFarm: { fontSize: 12, color: '#888' },

  bottomCta: { background: '#27500A', padding: isMobile ? '2.5rem 1rem' : '3.5rem 1.5rem', textAlign: 'center' },
  bottomH:   { fontSize: isMobile ? 20 : 26, fontWeight: 500, color: '#f2f7eb', marginBottom: 8 },
  bottomSub: { fontSize: 13, color: '#C0DD97', marginBottom: 20 },

  // Modal — full screen on mobile
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : '1rem' },
  modalCard: { background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 18, padding: isMobile ? '1.5rem 1.25rem 2rem' : '2rem', maxWidth: 420, width: '100%', maxHeight: isMobile ? '92vh' : '90vh', overflowY: 'auto' },
  modalHeader: { textAlign: 'center', marginBottom: 20 },
  modalLogo: { fontSize: 32, marginBottom: 10 },
  modalTitle: { fontSize: 19, fontWeight: 500, marginBottom: 5, color: '#0f0f0e' },
  modalSub:   { fontSize: 13, color: '#888', lineHeight: 1.5 },
  formGroup:  { marginBottom: 12 },
  label:  { display: 'block', fontSize: 12, color: '#555', marginBottom: 5 },
  input:  { width: '100%', padding: '12px 13px', borderRadius: 9, border: '0.5px solid rgba(0,0,0,0.2)', fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  errorBox: { background: '#FCEBEB', color: '#A32D2D', borderRadius: 8, padding: '9px 13px', fontSize: 13, marginBottom: 12 },
  authBtn: { width: '100%', padding: '14px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' },
  divider: { textAlign: 'center', margin: '14px 0', fontSize: 12, color: '#bbb' },
  guestBtn: { width: '100%', padding: '12px', background: 'transparent', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: '#555', fontFamily: 'inherit' },
  switchAuth: { textAlign: 'center', marginTop: 14, fontSize: 13, color: '#888' },
  switchLink: { background: 'none', border: 'none', color: '#3B6D11', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline' },
}
