/**
 * Homestead — Seller Onboarding Page
 *
 * Collects basic info then redirects the seller to Stripe's hosted
 * Express onboarding flow. Stripe handles all KYC, bank account
 * collection, and compliance — you never see sensitive details.
 *
 * Routes:
 *   /seller/onboard         — this form
 *   /seller/onboard/complete — Stripe redirects here on success
 *   /seller/onboard/refresh  — Stripe redirects here if the link expired
 */

import { useState } from 'react'
import { startSellerOnboarding, getSellerStatus } from '../lib/stripe'

// ─── Main onboarding form ────────────────────────────────────────────────────

export function SellerOnboardPage() {
  const [form, setForm] = useState({ businessName: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // In a real app, sellerId comes from your auth system (e.g. the logged-in user's ID)
      const sellerId = 'seller_' + Date.now()
      await startSellerOnboarding({
        sellerId,
        email:        form.email,
        businessName: form.businessName,
      })
      // startSellerOnboarding() redirects to Stripe — code below won't run
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <span style={{ fontSize: 28 }}>🌾</span>
        </div>
        <h1 style={styles.h1}>Start selling on Homestead</h1>
        <p style={styles.sub}>
          You'll be taken to Stripe to securely set up your payout account.
          Stripe handles all banking details — we never see your account numbers.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Farm or business name</label>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. Sunridge Farm"
            value={form.businessName}
            onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
            required
          />

          <label style={styles.label}>Your email address</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@yourfarm.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Redirecting to Stripe…' : 'Set up payout account →'}
          </button>
        </form>

        <div style={styles.trustRow}>
          <span style={styles.trustItem}>🔒 Secured by Stripe</span>
          <span style={styles.trustItem}>🏦 Bank-level encryption</span>
          <span style={styles.trustItem}>✅ FDIC insured</span>
        </div>
      </div>
    </div>
  )
}

// ─── Success page (Stripe redirects here after onboarding) ───────────────────

export function SellerOnboardComplete() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 16, textAlign: 'center' }}>🎉</div>
        <h1 style={styles.h1}>You're all set!</h1>
        <p style={styles.sub}>
          Your payout account is connected. You can now list your goods and
          receive payments directly to your bank account.
        </p>
        <a href="/seller/dashboard" style={styles.btn}>
          Go to seller dashboard →
        </a>
      </div>
    </div>
  )
}

// ─── Refresh page (Stripe redirects here if the link expired) ────────────────

export function SellerOnboardRefresh() {
  const [loading, setLoading] = useState(false)

  async function retry() {
    setLoading(true)
    // Re-trigger onboarding — in a real app pull sellerId from your session
    await startSellerOnboarding({
      sellerId:     'seller_existing',
      email:        '',
      businessName: '',
    })
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Your onboarding link expired</h1>
        <p style={styles.sub}>
          Stripe onboarding links expire after 1 hour for security. Let's generate a new one.
        </p>
        <button style={styles.btn} onClick={retry} disabled={loading}>
          {loading ? 'Generating new link…' : 'Retry onboarding →'}
        </button>
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f0',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    border: '0.5px solid rgba(0,0,0,0.1)',
    padding: '2rem',
    maxWidth: 440,
    width: '100%',
  },
  iconWrap: {
    width: 56,
    height: 56,
    background: '#EAF3DE',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  h1: {
    fontSize: 22,
    fontWeight: 500,
    marginBottom: 8,
    color: '#0f0f0e',
  },
  sub: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 8,
    border: '0.5px solid rgba(0,0,0,0.2)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  btn: {
    display: 'block',
    width: '100%',
    marginTop: 20,
    padding: '12px',
    background: '#3B6D11',
    color: '#EAF3DE',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    fontFamily: 'inherit',
  },
  error: {
    fontSize: 13,
    color: '#A32D2D',
    background: '#FCEBEB',
    padding: '8px 12px',
    borderRadius: 8,
    marginTop: 12,
  },
  trustRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  trustItem: {
    fontSize: 11,
    color: '#888',
  },
}
