/**
 * Homestead — App Entry Point
 *
 * Sets up client-side routing. In production, configure your host
 * (Vercel / Netlify) to redirect all routes to index.html so
 * React Router handles navigation client-side.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SellerPlans from './pages/SellerPlans'
import ListingBoost from './pages/ListingBoost'
import {
  SellerOnboardPage,
  SellerOnboardComplete,
  SellerOnboardRefresh,
} from './pages/SellerOnboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main marketplace (your existing Homestead UI goes here) */}
        <Route path="/" element={<div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 500 }}>🌾 Homestead</h1>
          <p style={{ color: '#666', marginTop: 8 }}>Local organic marketplace</p>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/seller/onboard" style={linkStyle}>Become a seller →</a>
            <a href="/seller/plans"   style={linkStyle}>View seller plans →</a>
          </div>
        </div>} />

        {/* Seller onboarding (Stripe Connect) */}
        <Route path="/seller/onboard"          element={<SellerOnboardPage />} />
        <Route path="/seller/onboard/complete"  element={<SellerOnboardComplete />} />
        <Route path="/seller/onboard/refresh"   element={<SellerOnboardRefresh />} />

        {/* Seller subscription plans */}
        <Route path="/seller/plans" element={<SellerPlans />} />

        {/* Listing boosts — pass listing info via query params in a real app */}
        <Route path="/seller/boost/:listingId" element={
          <ListingBoost
            listingId="listing_demo"
            listingName="Farm-fresh brown eggs"
            sellerId="seller_demo"
          />
        } />

        {/* Post-payment success screens */}
        <Route path="/seller/subscription/success" element={
          <div style={successStyle}>
            <div style={{ fontSize: 48 }}>🎉</div>
            <h2>Subscription active!</h2>
            <p style={{ color: '#666' }}>Your 14-day free trial has started. Welcome to Homestead.</p>
            <a href="/seller/dashboard" style={linkStyle}>Go to dashboard →</a>
          </div>
        } />

        <Route path="/seller/boost/success" element={
          <div style={successStyle}>
            <div style={{ fontSize: 48 }}>🚀</div>
            <h2>Listing boosted!</h2>
            <p style={{ color: '#666' }}>Your listing is now at the top of search results.</p>
            <a href="/seller/listings" style={linkStyle}>Back to listings →</a>
          </div>
        } />

        <Route path="/order/success" element={
          <div style={successStyle}>
            <div style={{ fontSize: 48 }}>✅</div>
            <h2>Order placed!</h2>
            <p style={{ color: '#666' }}>You'll receive a receipt by email. Message the seller to arrange pickup.</p>
            <a href="/" style={linkStyle}>Back to marketplace →</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

const linkStyle = {
  display: 'inline-block',
  padding: '10px 18px',
  background: '#3B6D11',
  color: '#EAF3DE',
  borderRadius: 8,
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
}

const successStyle = {
  maxWidth: 400,
  margin: '4rem auto',
  textAlign: 'center',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
}
