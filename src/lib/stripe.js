/**
 * Homestead — Stripe client-side setup
 *
 * Import { stripePromise } wherever you need to load Stripe Elements,
 * or use the useStripeActions hook for server-driven flows (Checkout, Portal).
 */

import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

// Single instance — Stripe warns if you call loadStripe() more than once
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ─── API helper ──────────────────────────────────────────────────────────────

// Sends the signed-in user's login token so our /api functions know who's asking
async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiPost(path, body) {
  const res = await fetch(`/api${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

async function apiGet(path) {
  const res = await fetch(`/api${path}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

// ─── Seller Connect actions ───────────────────────────────────────────────────

/**
 * Start seller onboarding — creates the seller's Homestead profile (first
 * time only), then redirects to Stripe's hosted KYC flow.
 */
export async function startSellerOnboarding({ businessName, location } = {}) {
  const { url } = await apiPost('/connect/onboard', { businessName, location })
  window.location.href = url
}

/**
 * Open the signed-in seller's Stripe Express dashboard (payouts, balance, etc.)
 */
export async function openSellerDashboard() {
  const { url } = await apiPost('/connect/dashboard-link', {})
  window.open(url, '_blank')
}

/**
 * Check if the signed-in seller has finished Stripe onboarding (also
 * refreshes their verified badge in the database).
 */
export async function getSellerStatus() {
  return apiGet('/connect/status')
}

// ─── Subscription actions ─────────────────────────────────────────────────────

/**
 * Send seller to Stripe Checkout to subscribe to Grower or Harvest plan.
 * plan: 'grower' | 'harvest'
 */
export async function startSubscription({ plan }) {
  const { url } = await apiPost('/subscriptions/checkout', { plan })
  window.location.href = url
}

/**
 * Open Stripe Billing Portal so seller can manage / cancel their subscription.
 */
export async function openBillingPortal() {
  const { url } = await apiPost('/subscriptions/portal', {})
  window.location.href = url
}

// ─── Buyer checkout ───────────────────────────────────────────────────────────

/**
 * Create a PaymentIntent for a buyer purchasing a listing.
 * Returns { clientSecret, feePercent }. clientSecret goes to Stripe Elements, which collects
 * card details without the card number ever touching your server.
 */
export async function createListingPayment({ listingId }) {
  // The server looks up the price, seller and buyer itself
  return apiPost('/checkout/create', { listingId })
}

/**
 * Tell the server a payment went through so it saves the order.
 * (The Stripe webhook saves it too, in case this call never arrives.)
 */
export async function confirmOrder(paymentIntentId) {
  return apiPost('/orders/confirm', { paymentIntentId })
}

// ─── Listing boosts ───────────────────────────────────────────────────────────

/**
 * Send seller to Stripe Checkout to purchase a listing boost.
 * boostType: 'boost_7' | 'boost_30'
 */
export async function purchaseListingBoost({ boostType, listingId }) {
  const { url } = await apiPost('/boosts/checkout', { boostType, listingId })
  window.location.href = url
}
