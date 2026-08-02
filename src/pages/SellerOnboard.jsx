/**
 * Homestead — Seller Onboarding (fixed)
 *
 * Now saves seller info to localStorage via registerSeller() BEFORE
 * redirecting to Stripe. When Stripe sends the seller back to
 * /seller/onboard/complete, their dashboard is fully populated.
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { startSellerOnboarding } from '../lib/stripe'

// ─── Main onboarding form ────────────────────────────────────────────────────

export function SellerOnboardPage() {
  const { registerSeller, showToast } = useApp()
  const [form, setForm]     = useState({ name: '', businessName: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const sellerId = 'seller_' + Date.now()

      // ── Save seller to session BEFORE Stripe redirect ──────────────────────
      // This is the fix for the blank dashboard. When Stripe redirects back
      // to /seller/onboard/complete, localStorage already has the seller's info.
      registerSeller({
        name:            form.name,
        email:           form.email,
        sellerId,
        businessName:    form.businessName,
        stripeAccountId: null, // filled in by webhook after Stripe onboarding
      })

      // Now redirect to Stripe — this leaves the page
      await startSellerOnboarding({
        sellerId,
        email:        form.email,
        businessName: form.businessName,
      })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.iconWrap}>🌾</div>
        <h1 style={s.h1}>Start selling on Homestead</h1>
        <p style={s.sub}>
          You'll be taken to Stripe to securely connect your bank account.
          Stripe handles all banking details — we never see your account numbers.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Your name</label>
          <input
            style={s.input} type="text" placeholder="e.g. Sarah Johnson"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />

          <label style={s.label}>Farm or business name</label>
          <input
            style={s.input} type="text" placeholder="e.g. Sunridge Farm"
            value={form.businessName}
            onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
            required
          />

          <label style={s.label}>Your email address</label>
          <input
            style={s.input} type="email" placeholder="you@yourfarm.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />

          {error && <div style={s.error}>{error}</div>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Redirecting to Stripe…' : 'Set up payout account →'}
          </button>
        </form>

        <div style={s.trustRow}>
          <span style={s.trust}>🔒 Secured by Stripe</span>
          <span style={s.trust}>🏦 Bank-level encryption</span>
          <span style={s.trust}>✅ FDIC insured</span>
        </div>
      </div>
    </div>
  )
}

// ─── Success page — Stripe redirects here after onboarding ───────────────────

export function SellerOnboardComplete() {
  // By the time the seller arrives here, localStorage already has their info
  // thanks to registerSeller() being called before the Stripe redirect.
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 52, textAlign: 'center', marginBottom: 16 }}>🎉</div>
        <h1 style={s.h1}>You're all set!</h1>
        <p style={s.sub}>
          Your payout account is connected. You can now list your goods and receive
          payments directly to your bank account on a weekly schedule.
        </p>

        <a href="/" style={s.btn}>Go to your dashboard →</a>

        <div style={s.nextSteps}>
          <div style={s.nextTitle}>Next steps</div>
          {[
            { icon: '📋', text: 'Add your first listing from the Sell tab' },
            { icon: '📸', text: 'Add photos to make your listing stand out' },
            { icon: '💬', text: 'Respond to buyers within a few hours for best results' },
          ].map(step => (
            <div key={step.text} style={s.nextItem}>
              <span style={{ fontSize: 18 }}>{step.icon}</span>
              <span style={{ fontSize: 13, color: '#555' }}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Refresh page — Stripe redirects here if link expired ────────────────────

export function SellerOnboardRefresh() {
  const { user } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  async function retry() {
    setLoading(true)
    setError(null)
    try {
      await startSellerOnboarding({
        sellerId:     user?.id ?? 'seller_' + Date.now(),
        email:        user?.email ?? '',
        businessName: user?.seller?.businessName ?? '',
      })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⏱️</div>
        <h1 style={s.h1}>Your link expired</h1>
        <p style={s.sub}>
          Stripe onboarding links expire after 1 hour for security. No worries — click below
          to generate a fresh one and pick up where you left off.
        </p>
        {error && <div style={s.error}>{error}</div>}
        <button style={s.btn} onClick={retry} disabled={loading}>
          {loading ? 'Generating new link…' : 'Continue onboarding →'}
        </button>
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f5f5f0', padding: '1rem',
  },
  card: {
    background: '#fff', borderRadius: 16,
    border: '0.5px solid rgba(0,0,0,0.1)',
    padding: '2rem', maxWidth: 440, width: '100%',
  },
  iconWrap: {
    width: 56, height: 56, background: '#EAF3DE', borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, marginBottom: 16,
  },
  h1:    { fontSize: 22, fontWeight: 500, marginBottom: 8, color: '#0f0f0e' },
  sub:   { fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 },
  label: { display: 'block', fontSize: 12, color: '#555', marginBottom: 6, marginTop: 14 },
  input: {
    width: '100%', padding: '10px 13px', borderRadius: 8,
    border: '0.5px solid rgba(0,0,0,0.2)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  btn: {
    display: 'block', width: '100%', marginTop: 20, padding: '12px',
    background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
    textDecoration: 'none', fontFamily: 'inherit',
  },
  error: {
    fontSize: 13, color: '#A32D2D', background: '#FCEBEB',
    padding: '8px 12px', borderRadius: 8, marginTop: 12,
  },
  trustRow: { display: 'flex', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 8 },
  trust:    { fontSize: 11, color: '#888' },
  nextSteps:{ marginTop: 20, padding: 14, background: '#f8f8f5', borderRadius: 10 },
  nextTitle:{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 10 },
  nextItem: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
}
