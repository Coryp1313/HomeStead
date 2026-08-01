/**
 * Homestead — Seller Subscription Plans Page
 *
 * Shows Sprout (free), Grower ($19/mo), and Harvest ($49/mo) plans.
 * Clicking a paid plan redirects the seller to Stripe Checkout
 * which handles card collection, SCA, receipts, and trial periods.
 */

import { useState } from 'react'
import { startSubscription, openBillingPortal } from '../lib/stripe'

const PLANS = [
  {
    key:   'sprout',
    name:  'Sprout',
    price: 'Free',
    icon:  '🌱',
    color: '#F1EFE8',
    textColor: '#444',
    desc:  'Test the platform before committing.',
    features: [
      { text: '3 active listings',       included: true  },
      { text: 'Basic seller profile',     included: true  },
      { text: 'Buyer messaging',          included: true  },
      { text: '5% transaction fee',       included: true  },
      { text: 'Analytics dashboard',      included: false },
      { text: 'Priority search ranking',  included: false },
      { text: 'AI listing assistant',     included: false },
    ],
    cta: 'Start free',
    ctaAction: null, // No checkout — just sign up
  },
  {
    key:       'grower',
    name:      'Grower',
    price:     '$19',
    period:    '/ month',
    icon:      '🌿',
    color:     '#EAF3DE',
    textColor: '#27500A',
    featured:  true,
    desc:      'Everything a small farm needs to grow.',
    features: [
      { text: '25 active listings',       included: true },
      { text: 'Full profile + photos',    included: true },
      { text: 'Analytics dashboard',      included: true },
      { text: 'AI listing assistant',     included: true },
      { text: 'Priority search ranking',  included: true },
      { text: '0% transaction fee',       included: true },
      { text: 'Homepage featured slot',   included: false },
    ],
    cta: 'Start 14-day free trial',
    trial: true,
  },
  {
    key:       'harvest',
    name:      'Harvest',
    price:     '$49',
    period:    '/ month',
    icon:      '🚜',
    color:     '#FAEEDA',
    textColor: '#633806',
    desc:      'Full power for established farms.',
    features: [
      { text: 'Unlimited listings',        included: true },
      { text: 'Homepage featured slot',    included: true },
      { text: 'Advanced analytics',        included: true },
      { text: 'Custom farm page URL',      included: true },
      { text: 'CSA / pre-order tools',     included: true },
      { text: '0% transaction fee',        included: true },
      { text: 'Dedicated seller support',  included: true },
    ],
    cta: 'Start 14-day free trial',
    trial: true,
  },
]

export default function SellerPlans() {
  const [loading, setLoading] = useState(null)
  const [error, setError]     = useState(null)

  // In a real app, get sellerId and email from your auth context
  const currentSeller = { id: 'seller_demo', email: 'seller@example.com' }

  async function handlePlanSelect(plan) {
    if (!plan.key || plan.key === 'sprout') {
      window.location.href = '/seller/onboard'
      return
    }
    setLoading(plan.key)
    setError(null)
    try {
      await startSubscription({
        plan:     plan.key,
        sellerId: currentSeller.id,
        email:    currentSeller.email,
      })
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Choose your seller plan</h1>
        <p style={styles.headerSub}>
          Buyers always browse free. Sellers choose the plan that fits their farm.
          Paid plans include a 14-day free trial — no card charged upfront.
        </p>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.planGrid}>
        {PLANS.map(plan => (
          <div
            key={plan.key}
            style={{
              ...styles.planCard,
              ...(plan.featured ? styles.planCardFeatured : {}),
            }}
          >
            {plan.featured && (
              <div style={styles.featuredBadge}>Most popular</div>
            )}

            <div style={{ ...styles.planIcon, background: plan.color, color: plan.textColor }}>
              {plan.icon}
            </div>
            <div style={styles.planName}>{plan.name}</div>
            <div style={styles.planPrice}>
              {plan.price}
              {plan.period && <span style={styles.planPeriod}>{plan.period}</span>}
            </div>
            <div style={styles.planDesc}>{plan.desc}</div>

            {plan.trial && (
              <div style={styles.trialNote}>14-day free trial included</div>
            )}

            <ul style={styles.featureList}>
              {plan.features.map((f, i) => (
                <li key={i} style={styles.featureItem}>
                  <span style={{
                    ...styles.featureIcon,
                    color: f.included ? '#3B6D11' : '#bbb',
                  }}>
                    {f.included ? '✓' : '✗'}
                  </span>
                  <span style={{ color: f.included ? 'inherit' : '#bbb' }}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              style={{
                ...styles.planBtn,
                ...(plan.featured ? styles.planBtnPrimary : {}),
              }}
              onClick={() => handlePlanSelect(plan)}
              disabled={loading === plan.key}
            >
              {loading === plan.key ? 'Redirecting…' : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Billing portal link for sellers who are already subscribed */}
      <div style={styles.manageRow}>
        Already subscribed?{' '}
        <button
          style={styles.portalLink}
          onClick={() => openBillingPortal('cus_your_customer_id')}
        >
          Manage or cancel your plan
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  h1: { fontSize: 26, fontWeight: 500, marginBottom: 10 },
  headerSub: { fontSize: 14, color: '#666', lineHeight: 1.6, maxWidth: 520, margin: '0 auto' },
  errorBanner: {
    background: '#FCEBEB', color: '#A32D2D', padding: '10px 16px',
    borderRadius: 8, marginBottom: 16, fontSize: 13,
  },
  planGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  planCard: {
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 14,
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardFeatured: {
    border: '2px solid #3B6D11',
  },
  featuredBadge: {
    position: 'absolute', top: 0, right: 0,
    background: '#3B6D11', color: '#EAF3DE',
    fontSize: 11, fontWeight: 500,
    padding: '4px 12px',
    borderRadius: '0 12px 0 8px',
  },
  planIcon: {
    width: 44, height: 44, borderRadius: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, marginBottom: 12,
  },
  planName:   { fontSize: 16, fontWeight: 500, marginBottom: 4 },
  planPrice:  { fontSize: 26, fontWeight: 500, marginBottom: 4 },
  planPeriod: { fontSize: 14, fontWeight: 400, color: '#888' },
  planDesc:   { fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 10 },
  trialNote: {
    fontSize: 11, background: '#EAF3DE', color: '#27500A',
    padding: '3px 10px', borderRadius: 999, display: 'inline-block', marginBottom: 14,
  },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 1.25rem' },
  featureItem: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    fontSize: 13, padding: '4px 0', color: '#333',
  },
  featureIcon: { fontWeight: 500, fontSize: 14, flexShrink: 0, marginTop: 1 },
  planBtn: {
    width: '100%', padding: '11px', borderRadius: 9,
    border: '0.5px solid rgba(0,0,0,0.15)', background: 'transparent',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    color: '#333',
  },
  planBtnPrimary: {
    background: '#3B6D11', color: '#EAF3DE', border: 'none',
  },
  manageRow: {
    textAlign: 'center', marginTop: 24, fontSize: 13, color: '#888',
  },
  portalLink: {
    background: 'none', border: 'none', color: '#3B6D11',
    cursor: 'pointer', fontSize: 13, textDecoration: 'underline', fontFamily: 'inherit',
  },
}
