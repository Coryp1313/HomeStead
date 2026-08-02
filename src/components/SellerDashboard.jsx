/**
 * Homestead — Seller Dashboard (fixed blank state)
 *
 * Now reads from the persistent session in AppContext instead of
 * hardcoded mock data, so the dashboard is populated after sign-up.
 * Shows a helpful setup checklist when the seller is brand new.
 */

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  startSubscription,
  openBillingPortal,
  openSellerDashboard,
  purchaseListingBoost,
  startSellerOnboarding,
} from '../lib/stripe'
import { LISTINGS_WITH_SELLER } from '../lib/data'

export default function SellerDashboard({ onClose }) {
  const { user, showToast, logout } = useApp()
  const [loading, setLoading] = useState(null)

  const seller   = user?.seller
  const isNew    = !seller
  const hasStripe = seller?.stripeAccountId && !seller.stripeAccountId.includes('demo')

  const myListings = seller
    ? LISTINGS_WITH_SELLER.filter(l => l.sellerId === seller.id).slice(0, 4)
    : []

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function act(key, fn) {
    setLoading(key)
    try { await fn() }
    catch (e) { showToast(e.message, 'error') }
    finally { setLoading(null) }
  }

  const planColors = { sprout: '#f1f0eb', grower: '#EAF3DE', harvest: '#FAEEDA' }
  const planText   = { sprout: '#555',    grower: '#27500A', harvest: '#633806' }
  const planLabel  = { sprout: 'Sprout (free)', grower: 'Grower — $19/mo', harvest: 'Harvest — $49/mo' }

  // ── Not signed up yet ────────────────────────────────────────────────────────

  if (isNew) {
    return (
      <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={s.panel}>
          <div style={s.hd}>
            <div style={s.hdTitle}>Seller account</div>
            <button style={s.xBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div style={s.body}>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌾</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Start selling on Homestead</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
                Set up your seller account to list your goods, receive payments, and reach local buyers.
              </div>
              <a href="/seller/onboard" style={s.greenBtn}>
                Become a seller →
              </a>
              <a href="/seller/plans" style={{ ...s.greenBtn, background: 'transparent', color: '#3B6D11', border: '0.5px solid #3B6D11', marginTop: 10 }}>
                View seller plans
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Setup checklist for brand new sellers ────────────────────────────────────

  const setupItems = [
    { done: !!seller.stripeAccountId, label: 'Connect your bank account (Stripe)', action: () => act('onboard', () => startSellerOnboarding({ sellerId: seller.id, email: user.email, businessName: seller.businessName })), cta: 'Connect →' },
    { done: seller.plan !== 'sprout', label: 'Choose a seller plan', action: () => window.location.href = '/seller/plans', cta: 'View plans →' },
    { done: myListings.length > 0,   label: 'Add your first listing', action: onClose, cta: 'Go to Sell tab →' },
  ]
  const setupDone = setupItems.filter(i => i.done).length
  const allDone   = setupDone === setupItems.length

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>

        {/* Header */}
        <div style={s.hd}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={s.avatar}>
              {(seller.businessName || user.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={s.hdTitle}>{seller.businessName || user.name}</div>
              <div style={s.hdSub}>{user.email}</div>
            </div>
          </div>
          <button style={s.xBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={s.body}>

          {/* Setup checklist — shown until all 3 steps done */}
          {!allDone && (
            <div style={s.section}>
              <div style={s.secTitle}>Setup checklist</div>
              <div style={{ background: '#f8f8f5', borderRadius: 10, padding: '4px 0', marginBottom: 4 }}>
                <div style={{ background: '#EAF3DE', height: 4, borderRadius: 999, width: `${(setupDone / setupItems.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>{setupDone} of {setupItems.length} complete</div>
              {setupItems.map((item, i) => (
                <div key={i} style={{ ...s.checkRow, opacity: item.done ? 0.5 : 1 }}>
                  <div style={{ ...s.checkDot, background: item.done ? '#3B6D11' : '#ddd' }}>
                    {item.done ? '✓' : (i + 1)}
                  </div>
                  <div style={{ flex: 1, fontSize: 13 }}>{item.label}</div>
                  {!item.done && (
                    <button style={s.smallBtn} onClick={item.action}
                      disabled={loading === 'onboard'}>
                      {loading === 'onboard' && i === 0 ? '…' : item.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Plan */}
          <div style={s.section}>
            <div style={s.secTitle}>Current plan</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 999, fontWeight: 500,
                background: planColors[seller.plan] ?? '#f1f0eb',
                color:      planText[seller.plan]   ?? '#555',
              }}>
                {planLabel[seller.plan] ?? 'Sprout (free)'}
              </span>
              <span style={{ fontSize: 12, color: seller.planStatus === 'active' ? '#3B6D11' : '#BA7517' }}>
                {seller.planStatus === 'trialing' ? '🟡 Trial' : seller.planStatus === 'active' ? '🟢 Active' : ''}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {seller.plan === 'sprout' && <>
                <button style={s.upgradeBtn} disabled={loading === 'ug'} onClick={() => act('ug', () => startSubscription({ plan: 'grower', sellerId: seller.id, email: user.email }))}>
                  {loading === 'ug' ? 'Redirecting…' : 'Upgrade to Grower — $19/mo ↗'}
                </button>
                <button style={{ ...s.upgradeBtn, background: '#FAEEDA', color: '#633806' }} disabled={loading === 'uh'} onClick={() => act('uh', () => startSubscription({ plan: 'harvest', sellerId: seller.id, email: user.email }))}>
                  {loading === 'uh' ? 'Redirecting…' : 'Upgrade to Harvest — $49/mo ↗'}
                </button>
              </>}
              {seller.plan === 'grower' && <>
                <button style={{ ...s.upgradeBtn, background: '#FAEEDA', color: '#633806' }} disabled={loading === 'uh'} onClick={() => act('uh', () => startSubscription({ plan: 'harvest', sellerId: seller.id, email: user.email }))}>
                  {loading === 'uh' ? 'Redirecting…' : 'Upgrade to Harvest — $49/mo ↗'}
                </button>
              </>}
              {seller.plan !== 'sprout' && seller.stripeCustomerId && (
                <button style={s.grayBtn} disabled={loading === 'portal'} onClick={() => act('portal', () => openBillingPortal(seller.stripeCustomerId))}>
                  {loading === 'portal' ? 'Opening…' : 'Manage or cancel plan'}
                </button>
              )}
            </div>
          </div>

          {/* Payouts */}
          <div style={s.section}>
            <div style={s.secTitle}>Payouts</div>
            {hasStripe ? (
              <div style={s.payoutRow}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Stripe Express account</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>View your balance and payouts</div>
                </div>
                <button style={s.greenBtnSm} disabled={loading === 'payouts'} onClick={() => act('payouts', () => openSellerDashboard(seller.stripeAccountId))}>
                  {loading === 'payouts' ? '…' : 'Open →'}
                </button>
              </div>
            ) : (
              <button style={s.upgradeBtn} disabled={loading === 'onboard'} onClick={() => act('onboard', () => startSellerOnboarding({ sellerId: seller.id, email: user.email, businessName: seller.businessName }))}>
                {loading === 'onboard' ? 'Redirecting…' : '⚡ Connect your bank account to receive payouts'}
              </button>
            )}
          </div>

          {/* Listings */}
          <div style={s.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={s.secTitle}>Your listings</div>
              <button style={{ ...s.smallBtn, fontSize: 11 }} onClick={onClose}>+ Add listing</button>
            </div>
            {myListings.length === 0 ? (
              <div style={{ fontSize: 13, color: '#888', padding: '1rem 0' }}>
                No listings yet. <button style={{ color: '#3B6D11', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }} onClick={onClose}>Add your first one →</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {myListings.map(l => (
                  <div key={l.id} style={s.listingRow}>
                    <span style={{ fontSize: 20 }}>{l.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>${l.price.toFixed(2)} {l.unit}</div>
                    </div>
                    {l.boosted
                      ? <span style={s.boostedTag}>Boosted</span>
                      : <button style={s.smallBtn} disabled={loading === 'boost_' + l.id}
                          onClick={() => act('boost_' + l.id, () => purchaseListingBoost({ boostType: 'boost_7', listingId: l.id, sellerId: seller.id }))}>
                          {loading === 'boost_' + l.id ? '…' : '⚡ Boost'}
                        </button>
                    }
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={s.section}>
            <div style={s.secTitle}>This month</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[['0', 'Orders'], ['$0', 'Revenue'], ['—', 'Rating']].map(([v, l]) => (
                <div key={l} style={{ background: '#f8f8f5', borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <button style={{ ...s.grayBtn, marginTop: 8, color: '#A32D2D' }} onClick={() => { logout(); onClose() }}>
            Sign out
          </button>

        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' },
  panel:   { width: 380, maxWidth: '95vw', background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', borderLeft: '0.5px solid rgba(0,0,0,0.1)', overflowY: 'auto' },
  hd:      { padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 10 },
  hdTitle: { fontSize: 15, fontWeight: 500 },
  hdSub:   { fontSize: 11, color: '#888', marginTop: 1 },
  avatar:  { width: 38, height: 38, borderRadius: '50%', background: '#EAF3DE', color: '#27500A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 },
  xBtn:    { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#999', padding: 4 },
  body:    { padding: '16px 20px', flex: 1 },
  section: { marginBottom: 24 },
  secTitle:{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  checkRow:{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #f0f0f0' },
  checkDot:{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 },
  upgradeBtn: { padding: '10px 14px', border: 'none', borderRadius: 8, background: '#EAF3DE', color: '#27500A', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' },
  grayBtn:    { padding: '9px 14px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8, background: 'transparent', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#555', width: '100%' },
  smallBtn:   { padding: '4px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#333', whiteSpace: 'nowrap' },
  greenBtn:   { display: 'block', padding: '12px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', fontFamily: 'inherit', marginBottom: 8 },
  greenBtnSm: { padding: '7px 12px', background: '#3B6D11', color: '#EAF3DE', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  payoutRow:  { background: '#f8f8f5', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listingRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8f8f5', borderRadius: 8 },
  boostedTag: { fontSize: 10, padding: '3px 9px', borderRadius: 999, background: '#EEEDFE', color: '#534AB7', fontWeight: 500 },
}
