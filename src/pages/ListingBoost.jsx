/**
 * Homestead — Listing Boost Page
 *
 * Sellers can pay to boost a specific listing to the top of search
 * results for 7 or 30 days. Always labeled "Boosted" for buyers.
 */

import { useState } from 'react'
import { purchaseListingBoost } from '../lib/stripe'

const BOOST_OPTIONS = [
  {
    key:      'boost_7',
    label:    '7-day boost',
    price:    '$5',
    icon:     '⚡',
    color:    '#EAF3DE',
    textColor:'#27500A',
    perks: [
      'Top of category search for 7 days',
      '"Boosted" badge on your listing',
      'Pinned in AI Finder results',
    ],
  },
  {
    key:      'boost_30',
    label:    '30-day boost',
    price:    '$25',
    icon:     '🚀',
    color:    '#EEEDFE',
    textColor:'#3C3489',
    featured: true,
    perks: [
      'Top of category search for 30 days',
      '"Boosted" badge on your listing',
      'Pinned in AI Finder results',
      'Featured in weekly buyer newsletter',
    ],
  },
]

export default function ListingBoost({ listingId, listingName, sellerId }) {
  const [loading, setLoading] = useState(null)
  const [error, setError]     = useState(null)

  async function handleBoost(boostType) {
    setLoading(boostType)
    setError(null)
    try {
      await purchaseListingBoost({ boostType, listingId, sellerId })
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>Boost this listing</h2>
      <p style={styles.sub}>
        <strong>"{listingName}"</strong> — get it seen by more local buyers.
        Boosts are clearly labeled so buyer trust is never compromised.
      </p>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {BOOST_OPTIONS.map(opt => (
          <div
            key={opt.key}
            style={{
              ...styles.card,
              ...(opt.featured ? styles.cardFeatured : {}),
            }}
          >
            {opt.featured && <div style={styles.badge}>Best value</div>}

            <div style={{ ...styles.iconBox, background: opt.color, color: opt.textColor }}>
              {opt.icon}
            </div>
            <div style={styles.optLabel}>{opt.label}</div>
            <div style={styles.optPrice}>{opt.price}</div>

            <ul style={styles.perks}>
              {opt.perks.map((p, i) => (
                <li key={i} style={styles.perk}>
                  <span style={{ color: '#3B6D11' }}>✓</span> {p}
                </li>
              ))}
            </ul>

            <button
              style={{
                ...styles.btn,
                ...(opt.featured ? styles.btnPrimary : {}),
                opacity: loading === opt.key ? 0.7 : 1,
              }}
              onClick={() => handleBoost(opt.key)}
              disabled={!!loading}
            >
              {loading === opt.key ? 'Redirecting…' : `Boost for ${opt.price}`}
            </button>
          </div>
        ))}
      </div>

      <p style={styles.note}>
        Boosts are one-time payments. No recurring charges.
        Buyers always see a "Boosted" label — transparency is part of Homestead's promise.
      </p>
    </div>
  )
}

const styles = {
  page:  { maxWidth: 560, margin: '0 auto', padding: '1.5rem 1rem' },
  h2:    { fontSize: 20, fontWeight: 500, marginBottom: 6 },
  sub:   { fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 20 },
  error: { background: '#FCEBEB', color: '#A32D2D', padding: '9px 13px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  grid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  card: {
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: 13, padding: '1.25rem', position: 'relative', overflow: 'hidden',
  },
  cardFeatured: { border: '2px solid #534AB7' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    background: '#534AB7', color: '#EEEDFE',
    fontSize: 10, padding: '3px 10px',
    borderRadius: '0 11px 0 7px',
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 10, fontSize: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  optLabel: { fontSize: 14, fontWeight: 500, marginBottom: 2 },
  optPrice: { fontSize: 22, fontWeight: 500, marginBottom: 12 },
  perks:    { listStyle: 'none', padding: 0, margin: '0 0 14px' },
  perk:     { fontSize: 12, color: '#444', padding: '3px 0', display: 'flex', gap: 6 },
  btn: {
    width: '100%', padding: '10px',
    border: '0.5px solid rgba(0,0,0,0.15)',
    background: 'transparent', borderRadius: 8,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnPrimary: {
    background: '#3B6D11', color: '#EAF3DE', border: 'none',
  },
  note: { fontSize: 11, color: '#999', lineHeight: 1.5, textAlign: 'center' },
}
