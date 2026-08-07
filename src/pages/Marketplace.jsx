/**
 * Homestead — Marketplace (fully wired)
 *
 * The main page. Integrates:
 *   ✓ Listing grid with Buy Now → BuyerCheckout → Stripe payment
 *   ✓ Cart sidebar with per-item checkout
 *   ✓ Seller dashboard with plan upgrade, boosts, payout link
 *   ✓ Category + search filtering
 *   ✓ AI finder with distance/price sliders
 *   ✓ Map tab (visual only)
 *   ✓ Account tab with order history
 */

import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import ListingCard from '../components/ListingCard'
import CartSidebar from '../components/CartSidebar'
import SellerDashboard from '../components/SellerDashboard'
import NotificationPanel from '../components/NotificationPanel'
import { LISTINGS_WITH_SELLER, SELLERS } from '../lib/data'

const CATEGORIES = [
  { key: 'all',      label: 'All goods',     icon: '▦' },
  { key: 'eggs',     label: 'Eggs',          icon: '🥚' },
  { key: 'meat',     label: 'Meat',          icon: '🥩' },
  { key: 'honey',    label: 'Honey',         icon: '🍯' },
  { key: 'dairy',    label: 'Dairy',         icon: '🥛' },
  { key: 'produce',  label: 'Produce',       icon: '🥬' },
  { key: 'preserves',label: 'Preserves',     icon: '🍓' },
]

export default function Marketplace() {
  const { cart, orders, user, logout } = useApp()

  // Nav state
  const [activeTab,  setActiveTab]  = useState('browse')
  const [cartOpen,   setCartOpen]   = useState(false)
  const [sellerOpen, setSellerOpen] = useState(false)

  // Browse filters
  const [category, setCategory]   = useState('all')
  const [search,   setSearch]     = useState('')

  // AI finder state
  const [aiCat,    setAiCat]    = useState('all')
  const [maxDist,  setMaxDist]  = useState(10)
  const [maxPrice, setMaxPrice] = useState(15)

  // ── Derived data ─────────────────────────────────────────────────────────

  const filteredListings = useMemo(() => {
    let items = LISTINGS_WITH_SELLER
    if (category !== 'all') items = items.filter(l => l.category === category)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.seller?.name.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    // Boosted listings float to top
    return [...items].sort((a, b) => (b.boosted ? 1 : 0) - (a.boosted ? 1 : 0))
  }, [category, search])

  const aiResults = useMemo(() => {
    return LISTINGS_WITH_SELLER
      .filter(l =>
        (aiCat === 'all' || l.category === aiCat) &&
        (l.seller?.dist ?? 99) <= maxDist &&
        l.price <= maxPrice
      )
      .sort((a, b) => (a.seller?.dist ?? 99) - (b.seller?.dist ?? 99))
      .slice(0, 6)
  }, [aiCat, maxDist, maxPrice])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={s.app}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => setActiveTab('browse')}>
          <div style={s.logoBox}>🌾</div>
          <div>
            <div style={s.brand}>Homestead</div>
            <div style={s.brandSub}>Local organic marketplace</div>
          </div>
        </div>

        <div style={s.navRight}>
          {/* Cart icon with badge */}
          <button
            style={s.iconBtn}
            onClick={() => setCartOpen(true)}
            aria-label={`Cart (${cart.length} items)`}
          >
            🛒
            {cart.length > 0 && (
              <span style={s.cartBadge}>{cart.length}</span>
            )}
          </button>

          {/* Notifications bell */}
          <NotificationPanel />

          {/* Seller dashboard toggle */}
          <button
            style={s.iconBtn}
            onClick={() => setSellerOpen(true)}
            aria-label="Seller dashboard"
          >
            🏪
          </button>

          {/* Become a seller CTA */}
          <button
            style={s.ctaBtn}
            onClick={() => setActiveTab('sell')}
          >
            + List goods
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={s.hero}>
        <div style={s.heroTag}>100% local & organic</div>
        <h1 style={s.heroH}>Your neighbor's farm,<br /><em style={{ fontStyle: 'italic', color: '#C0DD97' }}>at your fingertips.</em></h1>
        <p style={s.heroSub}>Pasture-raised meats, raw honey, heirloom produce, and handcrafted goods — within miles of your door.</p>

        <div style={s.searchWrap}>
          <span style={{ padding: '0 10px', color: 'rgba(234,243,222,0.5)', fontSize: 16 }}>🔍</span>
          <input
            style={s.searchInput}
            type="text"
            placeholder="Search eggs, honey, beef, jam..."
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveTab('browse') }}
          />
          <div style={s.searchLoc}>📍 Fort Collins, CO</div>
        </div>

        <div style={s.heroStats}>
          {[['48', 'Local sellers'], ['210+', 'Products'], ['15 mi', 'Avg. distance'], ['4.9 ★', 'Avg. rating']].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={s.statN}>{val}</div>
              <div style={s.statL}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div style={s.tabBar}>
        {[
          { key: 'browse',   icon: '▦',  label: 'Browse'     },
          { key: 'map',      icon: '📍', label: 'Map'        },
          { key: 'ai',       icon: '✦',  label: 'AI finder'  },
          { key: 'orders',   icon: '📦', label: 'Orders'     },
          { key: 'sell',     icon: '🏪', label: 'Sell'       },
          { key: 'account',  icon: '👤', label: user.isGuest ? 'Sign in' : (user.name?.split(' ')[0] || 'Account') },
        ].map(tab => (
          <button
            key={tab.key}
            style={{ ...s.tabBtn, ...(activeTab === tab.key ? s.tabBtnActive : {}) }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={s.main}>

        {/* BROWSE */}
        {activeTab === 'browse' && (
          <>
            {/* Category chips */}
            <div style={s.chips}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  style={{ ...s.chip, ...(category === cat.key ? s.chipActive : {}) }}
                  onClick={() => setCategory(cat.key)}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <div style={s.rowHd}>
              <span style={s.rowTitle}>
                {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} near you
              </span>
              <span style={s.rowSub}>Nearest first · Boosted pinned top</span>
            </div>

            {filteredListings.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 32 }}>🔍</div>
                <div style={{ fontWeight: 500, marginTop: 8 }}>No listings found</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Try a different category or search term</div>
              </div>
            ) : (
              <div style={s.grid}>
                {filteredListings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </>
        )}

        {/* MAP */}
        {activeTab === 'map' && (
          <div style={s.mapWrap}>
            <div style={s.mapHd}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>📍 Northern Colorado · 25 mi radius</span>
              <span style={{ fontSize: 12, color: '#888' }}>6 sellers · tap a pin for details</span>
            </div>
            <svg viewBox="0 0 660 300" style={{ width: '100%', display: 'block', background: '#EAF3DE' }}>
              <defs>
                <pattern id="mg" width="44" height="44" patternUnits="userSpaceOnUse">
                  <path d="M44 0L0 0 0 44" fill="none" stroke="#C0DD97" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="660" height="300" fill="url(#mg)" opacity="0.5"/>
              <ellipse cx="330" cy="155" rx="200" ry="100" fill="#C0DD97" opacity="0.2"/>
              <text x="296" y="150" fontSize="12" fill="#27500A" fontWeight="500" fontFamily="system-ui">Fort Collins</text>
              <circle cx="330" cy="158" r="5" fill="#27500A"/>
              {[
                { x:340, y:115, c:'#3B6D11', t:'#EAF3DE', e:'🌾', n:'Sunridge Farm'       },
                { x:540, y: 72, c:'#BA7517', t:'#FAEEDA', e:'🐝', n:'Mesa Bees Co.'        },
                { x:158, y:200, c:'#993C1D', t:'#FAECE7', e:'🐄', n:'Poudre Valley Ranch'  },
                { x:480, y:182, c:'#0F6E56', t:'#E1F5EE', e:'🐐', n:'Happy Hooves'         },
                { x:300, y:120, c:'#3B6D11', t:'#EAF3DE', e:'🌿', n:'Dirt & Dew Garden'    },
                { x:405, y:238, c:'#993C1D', t:'#FAECE7', e:'🫙', n:'Kitchen Roots'        },
              ].map(p => (
                <g key={p.n} style={{ cursor: 'pointer' }} onClick={() => { setSearch(p.n.split(' ')[0]); setActiveTab('browse') }}>
                  <circle cx={p.x} cy={p.y} r={15} fill={p.c} opacity="0.15"/>
                  <circle cx={p.x} cy={p.y} r={10} fill={p.c}/>
                  <text x={p.x} y={p.y + 4} fontSize="12" textAnchor="middle" fontFamily="sans-serif">{p.e}</text>
                </g>
              ))}
            </svg>
            <div style={s.mapLegend}>
              <span style={s.legItem}><span style={{ ...s.legDot, background: '#3B6D11' }}/> Farm / produce</span>
              <span style={s.legItem}><span style={{ ...s.legDot, background: '#BA7517' }}/> Honey</span>
              <span style={s.legItem}><span style={{ ...s.legDot, background: '#993C1D' }}/> Meat / preserves</span>
              <span style={s.legItem}><span style={{ ...s.legDot, background: '#0F6E56' }}/> Dairy</span>
            </div>
            <p style={{ fontSize: 12, color: '#888', padding: '0 16px 16px', margin: 0 }}>
              Tap any pin to filter listings by that seller.
            </p>
          </div>
        )}

        {/* AI FINDER */}
        {activeTab === 'ai' && (
          <div style={s.aiPanel}>
            <div style={s.aiHd}>
              <div style={s.aiIconWrap}>✦</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Smart finder</div>
                <div style={{ fontSize: 12, color: '#888' }}>Filter by distance, price, and category</div>
              </div>
            </div>

            {/* Category */}
            <div style={s.filterLabel}>Category</div>
            <div style={s.filterChips}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  style={{ ...s.fchip, ...(aiCat === cat.key ? s.fchipOn : {}) }}
                  onClick={() => setAiCat(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Distance slider */}
            <div style={s.rangeRow}>
              <label style={s.rangeLabel}>Max distance</label>
              <input type="range" min="1" max="25" step="1" value={maxDist}
                onChange={e => setMaxDist(Number(e.target.value))} style={{ flex: 1 }}/>
              <span style={s.rangeVal}>{maxDist} mi</span>
            </div>

            {/* Price slider */}
            <div style={s.rangeRow}>
              <label style={s.rangeLabel}>Max price / unit</label>
              <input type="range" min="2" max="25" step="1" value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))} style={{ flex: 1 }}/>
              <span style={s.rangeVal}>${maxPrice}</span>
            </div>

            {/* Results */}
            <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
              {aiResults.length} match{aiResults.length !== 1 ? 'es' : ''} found
            </div>

            {aiResults.length === 0 ? (
              <div style={s.empty}>
                <div>No matches — try widening your filters</div>
              </div>
            ) : (
              <div style={s.grid}>
                {aiResults.map(listing => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {activeTab === 'orders' && (
          <div>
            <div style={s.rowHd}>
              <span style={s.rowTitle}>Order history</span>
            </div>
            {orders.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 32 }}>📦</div>
                <div style={{ fontWeight: 500, marginTop: 8 }}>No orders yet</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  Browse listings and click "Buy now" to place your first order.
                </div>
                <button style={{ ...s.ctaBtn, marginTop: 16 }} onClick={() => setActiveTab('browse')}>
                  Browse listings
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(order => (
                  <div key={order.id} style={s.orderRow}>
                    <span style={{ fontSize: 24 }}>{order.listing.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{order.listing.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>
                        {order.listing.seller?.name} · ${order.listing.price.toFixed(2)} {order.listing.unit}
                      </div>
                    </div>
                    <span style={s.orderStatus}>
                      {order.status === 'awaiting_pickup' ? '🟡 Awaiting pickup' : '✅ Picked up'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SELL */}
        {activeTab === 'sell' && (
          <div style={s.sellPage}>
            <div style={s.sellHero}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌾</div>
              <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>Start selling on Homestead</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 24px' }}>
                Reach local buyers actively looking for exactly what you grow and make.
                Set up takes under 10 minutes — Stripe handles all payments and payouts.
              </p>
              <div style={s.howGrid}>
                {[
                  { icon: '📝', title: 'Create your profile', desc: 'Tell buyers about your farm, your practices, and what makes your goods special.' },
                  { icon: '💳', title: 'Connect Stripe',      desc: 'Stripe securely links your bank account. You\'ll receive payouts directly, automatically.' },
                  { icon: '📋', title: 'List your goods',     desc: 'Add photos, prices, and availability. Listings go live after a quick review.' },
                  { icon: '💰', title: 'Start earning',       desc: 'Buyers pay through Homestead. You get 95% deposited to your bank on a weekly schedule.' },
                ].map(step => (
                  <div key={step.title} style={s.howCard}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{step.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                ))}
              </div>
              <div style={s.sellActions}>
                <button style={s.sellCta} onClick={() => window.location.href = '/seller/onboard'}>
                  Set up your seller account →
                </button>
                <button style={s.sellSecondary} onClick={() => window.location.href = '/seller/plans'}>
                  View seller plans
                </button>
              </div>
              <div style={s.trustRow}>
                <span style={s.trustItem}>🔒 Stripe-secured payments</span>
                <span style={s.trustItem}>💸 Weekly payouts</span>
                <span style={s.trustItem}>📋 Automated 1099s</span>
                <span style={s.trustItem}>🆓 Free to list on Sprout</span>
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {activeTab === 'account' && (
          <div style={{ maxWidth: 480 }}>
            {/* Profile card */}
            <div style={s.acctCard}>
              <div style={s.acctAvatar}>
                {(user.name || 'G').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>
                  {user.isGuest ? 'Guest' : user.name || 'Member'}
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>{user.email || 'Browsing as guest'}</div>
              </div>
            </div>

            {/* Guest upsell */}
            {user.isGuest && (
              <div style={{ ...s.acctSection, background: '#EAF3DE', border: '0.5px solid #97C459' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#27500A', marginBottom: 6 }}>
                  Create a free account to:
                </div>
                {['Save favourite listings', 'Track your orders', 'Message sellers directly', 'Sell your own goods'].map(b => (
                  <div key={b} style={{ fontSize: 13, color: '#3B6D11', padding: '3px 0' }}>✓ {b}</div>
                ))}
                <button style={{ ...s.sellCta, marginTop: 14, display: 'block', width: '100%', textAlign: 'center', textDecoration: 'none' }}
                  onClick={() => window.location.replace('/?signup=1')}>
                  Create free account →
                </button>
              </div>
            )}

            {/* Orders */}
            <div style={s.acctSection}>
              <div style={s.acctSecTitle}>Order history</div>
              {orders.length === 0 ? (
                <div style={{ fontSize: 13, color: '#888', padding: '8px 0' }}>
                  No orders yet. <button style={s.inlineLink} onClick={() => setActiveTab('browse')}>Browse listings →</button>
                </div>
              ) : orders.map(order => (
                <div key={order.id} style={s.orderRow}>
                  <span style={{ fontSize: 22 }}>{order.listing.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{order.listing.name}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{order.listing.seller?.name} · ${order.listing.price.toFixed(2)}</div>
                  </div>
                  <span style={s.orderStatus}>
                    {order.status === 'awaiting_pickup' ? '🟡 Pickup pending' : '✅ Done'}
                  </span>
                </div>
              ))}
            </div>

            {/* Seller section */}
            {!user.isGuest && (
              <div style={s.acctSection}>
                <div style={s.acctSecTitle}>Seller account</div>
                {user.seller ? (
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{user.seller.businessName}</div>
                    <div style={{ color: '#888', marginBottom: 10 }}>Plan: {user.seller.plan ?? 'Sprout'}</div>
                    <button style={s.sellCta} onClick={() => setSellerOpen(true)}>Open seller dashboard →</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
                      Have goods to sell? List them on Homestead and reach local buyers.
                    </div>
                    <button style={s.sellCta} onClick={() => setActiveTab('sell')}>Start selling →</button>
                  </div>
                )}
              </div>
            )}

            {/* Sign out */}
            {!user.isGuest && (
              <button
                style={{ ...s.sellSecondary, width: '100%', marginTop: 8, color: '#A32D2D', borderColor: '#F09595' }}
                onClick={() => { logout(); window.location.replace('/') }}
              >
                Sign out
              </button>
            )}
            {user.isGuest && (
              <button
                style={{ ...s.sellSecondary, width: '100%', marginTop: 8 }}
                onClick={() => window.location.replace('/')}
              >
                ← Back to sign in
              </button>
            )}
          </div>
        )}

      </div>

      {/* ── Overlays ───────────────────────────────────────────────────────── */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      {sellerOpen && <SellerDashboard onClose={() => setSellerOpen(false)} />}

    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = {
  app: { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f5f5f0', minHeight: '100vh' },

  nav: {
    background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.09)',
    padding: '0 1rem', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', height: 52,
  },
  navLogo:  { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  logoBox:  { width: 32, height: 32, background: '#3B6D11', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  brand:    { fontSize: 15, fontWeight: 500 },
  brandSub: { fontSize: 10, color: '#aaa', marginTop: 1 },
  navRight: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: {
    position: 'relative',
    width: 36, height: 36, borderRadius: 8,
    border: '0.5px solid rgba(0,0,0,0.12)',
    background: 'transparent', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute', top: 3, right: 3,
    width: 16, height: 16, borderRadius: '50%',
    background: '#E24B4A', color: '#fff',
    fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1.5px solid #fff',
  },
  ctaBtn: {
    height: 36, padding: '0 14px',
    background: '#3B6D11', color: '#EAF3DE',
    border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },

  hero: { background: '#173404', padding: '1.75rem 1.25rem 1.5rem' },
  heroTag: { fontSize: 10, fontWeight: 500, letterSpacing: 1, color: '#97C459', textTransform: 'uppercase', marginBottom: 8 },
  heroH:   { fontSize: 22, fontWeight: 500, color: '#f2f7eb', lineHeight: 1.25, marginBottom: 8, letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: '#C0DD97', lineHeight: 1.6, marginBottom: '1rem', maxWidth: 500 },
  searchWrap: {
    display: 'flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.1)',
    border: '0.5px solid rgba(151,196,89,0.25)',
    borderRadius: 10, overflow: 'hidden', maxWidth: 520,
  },
  searchInput: {
    flex: 1, padding: '10px 0', border: 'none',
    background: 'transparent', color: '#f2f7eb',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  },
  searchLoc: {
    padding: '0 14px', fontSize: 12,
    color: '#C0DD97', borderLeft: '0.5px solid rgba(151,196,89,0.2)',
    whiteSpace: 'nowrap',
  },
  heroStats: { display: 'flex', gap: '1.5rem', marginTop: '1.25rem' },
  statN:     { fontSize: 20, fontWeight: 500, color: '#f2f7eb' },
  statL:     { fontSize: 11, color: '#C0DD97', marginTop: 1 },

  tabBar: {
    background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.09)',
    padding: '0 1.25rem', display: 'flex', gap: 0, overflowX: 'auto',
  },
  tabBtn: {
    padding: '13px 15px', fontSize: 13, cursor: 'pointer',
    color: '#888', border: 'none', background: 'transparent',
    borderBottom: '2px solid transparent', whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  tabBtnActive: { color: '#3B6D11', borderBottomColor: '#3B6D11', fontWeight: 500 },

  main: { padding: '1.25rem', maxWidth: 900, margin: '0 auto' },

  chips: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' },
  chip: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 999,
    border: '0.5px solid rgba(0,0,0,0.12)',
    background: '#fff', cursor: 'pointer',
    fontSize: 12, color: '#555', fontFamily: 'inherit',
  },
  chipActive: { background: '#EAF3DE', color: '#27500A', borderColor: '#97C459' },

  rowHd:    { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem' },
  rowTitle: { fontSize: 14, fontWeight: 500 },
  rowSub:   { fontSize: 12, color: '#aaa' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 10,
  },

  empty: {
    textAlign: 'center', padding: '3rem 1rem',
    color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  },

  mapWrap: {
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 12, overflow: 'hidden',
  },
  mapHd: {
    padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  mapLegend: {
    padding: '10px 16px', borderTop: '0.5px solid rgba(0,0,0,0.07)',
    display: 'flex', gap: 14, flexWrap: 'wrap',
  },
  legItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' },
  legDot:  { width: 9, height: 9, borderRadius: '50%', display: 'inline-block' },

  aiPanel: {
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 12, padding: '1.25rem',
  },
  aiHd: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '0.5px solid rgba(0,0,0,0.07)' },
  aiIconWrap: {
    width: 36, height: 36, background: '#EAF3DE',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, color: '#3B6D11',
  },
  filterLabel: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 7 },
  filterChips: { display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 },
  fchip: {
    padding: '5px 11px', borderRadius: 999,
    border: '0.5px solid rgba(0,0,0,0.12)',
    background: '#f8f8f5', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#555',
  },
  fchipOn: { background: '#EAF3DE', color: '#27500A', borderColor: '#97C459' },
  rangeRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  rangeLabel: { fontSize: 12, color: '#666', minWidth: 110 },
  rangeVal:   { fontSize: 12, fontWeight: 500, minWidth: 44, textAlign: 'right' },

  orderRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', background: '#fff',
    border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 10,
  },
  orderStatus: { fontSize: 12, whiteSpace: 'nowrap', color: '#555' },

  // Account tab
  acctCard: {
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 14, padding: '1.25rem',
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12,
  },
  acctAvatar: {
    width: 52, height: 52, borderRadius: '50%',
    background: '#EAF3DE', color: '#27500A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 600, flexShrink: 0,
  },
  acctSection: {
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 14, padding: '1.25rem', marginBottom: 12,
  },
  acctSecTitle: {
    fontSize: 12, fontWeight: 600, color: '#888',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  inlineLink: {
    background: 'none', border: 'none', color: '#3B6D11',
    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0,
  },

  sellPage:    { maxWidth: 640, margin: '0 auto' },
  sellHero:    { textAlign: 'center', padding: '1rem 0' },
  howGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12, marginBottom: 24, textAlign: 'left',
  },
  howCard: {
    background: '#fff', border: '0.5px solid rgba(0,0,0,0.09)',
    borderRadius: 12, padding: '1rem',
  },
  sellActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 },
  sellCta: {
    padding: '12px 24px', background: '#3B6D11', color: '#EAF3DE',
    border: 'none', borderRadius: 10, fontSize: 14,
    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  },
  sellSecondary: {
    padding: '12px 20px', background: 'transparent',
    border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 10, fontSize: 14,
    cursor: 'pointer', fontFamily: 'inherit', color: '#333',
  },
  trustRow: { display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  trustItem: { fontSize: 12, color: '#888' },
}
