/**
 * Homestead — App Entry Point
 *
 * Routing logic:
 *   - New visitors (not signed in) → LandingPage with login/signup
 *   - Signed-in members and guests → Marketplace directly
 *   - All Stripe redirect routes always accessible
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import LandingPage   from './pages/LandingPage'
import Marketplace   from './pages/Marketplace'
import SellerPlans   from './pages/SellerPlans'
import ListingBoost  from './pages/ListingBoost'
import {
  SellerOnboardPage,
  SellerOnboardComplete,
  SellerOnboardRefresh,
} from './pages/SellerOnboard'

// ── Route guard — shows landing to logged-out visitors ────────────────────────

function HomeRoute() {
  const { user, authReady } = useApp()

  // Wait until we know whether someone is already signed in
  if (!authReady) return <Loading />

  if (user?.id) {
    return <Marketplace />
  }

  return <LandingPage />
}

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
      🌾
    </div>
  )
}

// ── Shared success screen styles ──────────────────────────────────────────────

const success = {
  maxWidth: 400, margin: '5rem auto', textAlign: 'center',
  padding: '1rem', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: 12,
  fontFamily: 'system-ui, sans-serif',
}

const link = {
  display: 'inline-block', padding: '11px 22px',
  background: '#3B6D11', color: '#EAF3DE',
  borderRadius: 9, textDecoration: 'none',
  fontSize: 14, fontWeight: 500,
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Home: landing for guests, marketplace for members ── */}
          <Route path="/" element={<HomeRoute />} />

          {/* ── Seller onboarding (Stripe Connect) ── */}
          <Route path="/seller/onboard"          element={<SellerOnboardPage />} />
          <Route path="/seller/onboard/complete"  element={<SellerOnboardComplete />} />
          <Route path="/seller/onboard/refresh"   element={<SellerOnboardRefresh />} />

          {/* ── Subscription plans ── */}
          <Route path="/seller/plans" element={<SellerPlans />} />

          {/* ── Listing boosts ── */}
          <Route path="/seller/boost/:listingId" element={<ListingBoost />} />

          {/* ── Post-payment success screens ── */}
          <Route path="/seller/subscription/success" element={
            <div style={success}>
              <div style={{ fontSize: 52 }}>🎉</div>
              <h2 style={{ fontWeight: 500, fontSize: 20 }}>Subscription active!</h2>
              <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6 }}>
                Your 14-day free trial has started. Welcome to Homestead.
              </p>
              <a href="/" style={link}>Go to marketplace →</a>
            </div>
          } />

          <Route path="/seller/boost/success" element={
            <div style={success}>
              <div style={{ fontSize: 52 }}>🚀</div>
              <h2 style={{ fontWeight: 500, fontSize: 20 }}>Listing boosted!</h2>
              <p style={{ color: '#666', fontSize: 14 }}>
                Your listing is now pinned to the top of search results.
              </p>
              <a href="/" style={link}>Back to marketplace →</a>
            </div>
          } />

          <Route path="/order/success" element={
            <div style={success}>
              <div style={{ fontSize: 52 }}>✅</div>
              <h2 style={{ fontWeight: 500, fontSize: 20 }}>Order placed!</h2>
              <p style={{ color: '#666', fontSize: 14 }}>
                Receipt sent to your email. Message the seller to arrange pickup.
              </p>
              <a href="/" style={link}>Back to marketplace →</a>
            </div>
          } />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
