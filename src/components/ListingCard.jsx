/**
 * Homestead — ListingCard
 *
 * Displays a single listing. "Buy now" opens the BuyerCheckout modal.
 * "Save" toggles the favourite state. Boosted listings show a badge.
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import BuyerCheckout from './BuyerCheckout'

const BG = {
  'bg-green': '#EAF3DE',
  'bg-amber': '#FAEEDA',
  'bg-teal':  '#E1F5EE',
  'bg-coral': '#FAECE7',
}

export default function ListingCard({ listing }) {
  const { user, addOrder, showToast } = useApp()

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [faved, setFaved]               = useState(false)
  const [ordered, setOrdered]           = useState(false)

  function handleBuy(e) {
    e.stopPropagation()
    setCheckoutOpen(true)
  }

  function handleSuccess() {
    setCheckoutOpen(false)
    setOrdered(true)
    addOrder(listing)
    showToast(`Order placed — message ${listing.seller?.name} to arrange pickup!`, 'success')
  }

  function toggleFav(e) {
    e.stopPropagation()
    setFaved(f => !f)
    showToast(faved ? 'Removed from favourites' : 'Saved to favourites', 'success')
  }

  return (
    <>
      <div style={s.card}>
        {/* Thumb */}
        <div style={{ ...s.thumb, background: BG[listing.bg] || '#EAF3DE' }}>
          <span style={{ fontSize: 38 }}>{listing.emoji}</span>

          {listing.boosted && (
            <span style={s.boostedBadge}>Boosted</span>
          )}

          <button
            style={{ ...s.favBtn, color: faved ? '#E24B4A' : '#bbb' }}
            onClick={toggleFav}
            aria-label={faved ? 'Remove from favourites' : 'Save listing'}
          >
            ♥
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>
          <div style={s.sellerRow}>
            <span style={s.sellerName}>{listing.seller?.name}</span>
            {listing.seller?.verified && (
              <span style={s.verifiedDot} title="Verified seller">✓</span>
            )}
          </div>

          <div style={s.listingName}>{listing.name}</div>

          <div style={s.tags}>
            {listing.tags.slice(0, 2).map(t => (
              <span key={t} style={s.tag}>{t}</span>
            ))}
          </div>

          <div style={s.footer}>
            <div>
              <div style={s.price}>${listing.price.toFixed(2)}</div>
              <div style={s.unit}>{listing.unit}</div>
            </div>
            <div style={s.dist}>
              📍 {listing.seller?.dist} mi
            </div>
          </div>

          {/* Action buttons */}
          <div style={s.actions}>
            {ordered ? (
              <div style={s.orderedBadge}>✓ Ordered</div>
            ) : (
              <button style={s.buyBtn} onClick={handleBuy}>
                Buy now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkout modal — only mounts when open */}
      {checkoutOpen && (
        <BuyerCheckout
          listing={listing}
          buyerEmail={user.email}
          onSuccess={handleSuccess}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  )
}

const s = {
  card: {
    background: 'var(--color-background-primary, #fff)',
    border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.12s',
  },
  thumb: {
    height: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  boostedBadge: {
    position: 'absolute', top: 8, left: 8,
    background: '#534AB7', color: '#EEEDFE',
    fontSize: 9, fontWeight: 600,
    padding: '2px 7px', borderRadius: 999,
    letterSpacing: 0.4,
  },
  favBtn: {
    position: 'absolute', top: 6, right: 8,
    background: 'rgba(255,255,255,0.85)',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: '50%',
    width: 26, height: 26,
    cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'color 0.1s',
  },
  body: { padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', flex: 1 },
  sellerRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 },
  sellerName: { fontSize: 11, color: '#888' },
  verifiedDot: { fontSize: 10, color: '#3B6D11', fontWeight: 700 },
  listingName: { fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 6 },
  tags: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 },
  tag: {
    fontSize: 10, padding: '2px 7px',
    borderRadius: 999, background: '#EAF3DE', color: '#27500A',
  },
  footer: {
    display: 'flex', alignItems: 'flex-end',
    justifyContent: 'space-between', marginBottom: 10,
  },
  price:  { fontSize: 15, fontWeight: 500, color: '#27500A' },
  unit:   { fontSize: 10, color: '#aaa', marginTop: 1 },
  dist:   { fontSize: 11, color: '#888' },
  actions: { marginTop: 'auto' },
  buyBtn: {
    width: '100%', padding: '8px',
    background: '#3B6D11', color: '#EAF3DE',
    border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  orderedBadge: {
    width: '100%', padding: '8px',
    background: '#EAF3DE', color: '#27500A',
    border: '0.5px solid #97C459', borderRadius: 8,
    fontSize: 13, fontWeight: 500, textAlign: 'center',
  },
}
