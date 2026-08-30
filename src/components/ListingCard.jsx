/**
 * Homestead — ListingCard
 *
 * Guests see "Sign up to buy" which opens a friendly prompt instead of
 * a dead checkout. Members get the real Stripe checkout flow.
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
  const [guestPrompt, setGuestPrompt]   = useState(false)
  const [faved, setFaved]               = useState(false)
  const [ordered, setOrdered]           = useState(false)

  const isGuest = !user?.id || user?.isGuest

  function handleBuy(e) {
    e.stopPropagation()
    if (isGuest) {
      setGuestPrompt(true)
      return
    }
    setCheckoutOpen(true)
  }

  function handleSuccess() {
    setCheckoutOpen(false)
    setOrdered(true)
    addOrder(listing)
    showToast(`Order placed — message ${listing.seller?.name} to arrange pickup`, 'success')
  }

  function toggleFav(e) {
    e.stopPropagation()
    if (isGuest) { setGuestPrompt(true); return }
    setFaved(f => !f)
    showToast(faved ? 'Removed from saved' : 'Saved to your list', 'success')
  }

  return (
    <>
      <div style={s.card}>
        <div style={{ ...s.thumb, background: BG[listing.bg] || '#EAF3DE' }}>
          <span style={{ fontSize: 38 }}>{listing.emoji}</span>

          {listing.boosted && <span style={s.boostBadge}>Boosted</span>}

          <button
            style={{ ...s.favBtn, color: faved ? '#E24B4A' : '#bbb' }}
            onClick={toggleFav}
            aria-label={faved ? 'Remove from saved' : 'Save listing'}
          >
            ♥
          </button>
        </div>

        <div style={s.body}>
          <div style={s.sellerRow}>
            <span style={s.sellerName}>{listing.seller?.name}</span>
            {listing.seller?.verified && <span style={s.verified} title="Verified seller">✓</span>}
          </div>

          <div style={s.name}>{listing.name}</div>

          <div style={s.tags}>
            {listing.tags.slice(0, 2).map(t => <span key={t} style={s.tag}>{t}</span>)}
          </div>

          <div style={s.footer}>
            <div>
              <div style={s.price}>${listing.price.toFixed(2)}</div>
              <div style={s.unit}>{listing.unit}</div>
            </div>
            <div style={s.dist}>📍 {listing.seller?.dist} mi</div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            {ordered ? (
              <div style={s.orderedBadge}>✓ Ordered</div>
            ) : (
              <button style={isGuest ? s.guestBtn : s.buyBtn} onClick={handleBuy}>
                {isGuest ? 'Sign up to buy' : 'Buy now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest signup prompt */}
      {guestPrompt && (
        <div
          style={s.overlay}
          onClick={e => e.target === e.currentTarget && setGuestPrompt(false)}
        >
          <div style={s.promptCard}>
            <div style={{ ...s.promptThumb, background: BG[listing.bg] || '#EAF3DE' }}>
              {listing.emoji}
            </div>
            <h3 style={s.promptTitle}>Create a free account to buy</h3>
            <p style={s.promptSub}>
              You're browsing as a guest. Sign up free to order <strong>{listing.name}</strong> from {listing.seller?.name} and message them about pickup.
            </p>

            <div style={s.benefitList}>
              {[
                'Order directly from local farms',
                'Message sellers about pickup times',
                'Save your favourite farms and products',
                'Track your orders in one place',
              ].map(b => (
                <div key={b} style={s.benefit}>
                  <span style={{ color: '#3B6D11', flexShrink: 0 }}>✓</span>{b}
                </div>
              ))}
            </div>

            <button
              style={s.promptCta}
              onClick={() => { localStorage.removeItem('homestead_user'); window.location.replace('/') }}
            >
              Create free account →
            </button>
            <button style={s.promptSecondary} onClick={() => setGuestPrompt(false)}>
              Keep browsing
            </button>

            <div style={s.promptNote}>Free forever · No card required · 30 seconds</div>
          </div>
        </div>
      )}

      {/* Real checkout for members */}
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
    background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  thumb: {
    height: 100, display: 'flex', alignItems: 'center',
    justifyContent: 'center', position: 'relative', flexShrink: 0,
  },
  boostBadge: {
    position: 'absolute', top: 8, left: 8,
    background: '#534AB7', color: '#EEEDFE',
    fontSize: 9, fontWeight: 600, padding: '2px 7px',
    borderRadius: 999, letterSpacing: 0.4,
  },
  favBtn: {
    position: 'absolute', top: 6, right: 8,
    background: 'rgba(255,255,255,0.85)',
    border: '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: '50%', width: 26, height: 26,
    cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', flex: 1 },
  sellerRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 },
  sellerName: { fontSize: 11, color: '#888' },
  verified: { fontSize: 10, color: '#3B6D11', fontWeight: 700 },
  name: { fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 6, color: '#1a1a18' },
  tags: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 },
  tag: { fontSize: 10, padding: '2px 7px', borderRadius: 999, background: '#EAF3DE', color: '#27500A' },
  footer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 },
  price: { fontSize: 15, fontWeight: 500, color: '#27500A' },
  unit:  { fontSize: 10, color: '#aaa', marginTop: 1 },
  dist:  { fontSize: 11, color: '#888' },
  buyBtn: {
    width: '100%', padding: '8px', background: '#3B6D11', color: '#EAF3DE',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  guestBtn: {
    width: '100%', padding: '8px', background: '#EAF3DE', color: '#27500A',
    border: '0.5px solid #97C459', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  orderedBadge: {
    width: '100%', padding: '8px', background: '#EAF3DE', color: '#27500A',
    border: '0.5px solid #97C459', borderRadius: 8, fontSize: 13,
    fontWeight: 500, textAlign: 'center',
  },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(13,33,3,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  promptCard: {
    background: '#fff', borderRadius: 18, padding: '1.75rem',
    maxWidth: 390, width: '100%', textAlign: 'center',
    fontFamily: 'system-ui, sans-serif',
  },
  promptThumb: {
    width: 72, height: 72, borderRadius: 18, fontSize: 34,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  promptTitle: { fontSize: 18, fontWeight: 500, marginBottom: 8, color: '#0f0f0e' },
  promptSub:   { fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 18 },
  benefitList: {
    background: '#f8f8f5', borderRadius: 11, padding: '13px 15px',
    marginBottom: 18, textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 7,
  },
  benefit: { fontSize: 13, color: '#444', display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.45 },
  promptCta: {
    width: '100%', padding: '13px', background: '#3B6D11', color: '#EAF3DE',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
  },
  promptSecondary: {
    width: '100%', padding: '11px', background: 'transparent',
    border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 10,
    fontSize: 14, cursor: 'pointer', color: '#555', fontFamily: 'inherit',
  },
  promptNote: { fontSize: 11, color: '#aaa', marginTop: 13 },
}
