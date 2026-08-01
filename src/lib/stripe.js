/**
 * Homestead — Stripe client-side setup
 *
 * Import { stripePromise } wherever you need to load Stripe Elements,
 * or use the useStripeActions hook for server-driven flows (Checkout, Portal).
 */

import { loadStripe } from '@stripe/stripe-js'

// Single instance — Stripe warns if you call loadStripe() more than once
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// ─── API helper ──────────────────────────────────────────────────────────────

async function apiPost(path, body) {
  const res = await fetch(`/api${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

async function apiGet(path) {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

// ─── Seller Connect actions ───────────────────────────────────────────────────

/**
 * Start seller onboarding — redirects to Stripe's hosted KYC flow.
 * Call this when a new seller clicks "Become a seller".
 */
export async function startSellerOnboarding({ sellerId, email, businessName }) {
  const { url } = await apiPost('/connect/onboard', { sellerId, email, businessName })
  window.location.href = url
}

/**
 * Open the seller's Stripe Express dashboard (payouts, balance, etc.)
 */
export async function openSellerDashboard(accountId) {
  const { url } = await apiPost('/connect/dashboard-link', { accountId })
  window.open(url, '_blank')
}

/**
 * Check if a seller has finished onboarding and is verified.
 */
export async function getSellerStatus(accountId) {
  return apiGet(`/connect/status/${accountId}`)
}

// ─── Subscription actions ─────────────────────────────────────────────────────

/**
 * Send seller to Stripe Checkout to subscribe to Grower or Harvest plan.
 * plan: 'grower' | 'harvest'
 */
export async function startSubscription({ plan, sellerId, email }) {
  const { url } = await apiPost('/subscriptions/checkout', { plan, sellerId, email })
  window.location.href = url
}

/**
 * Open Stripe Billing Portal so seller can manage / cancel their subscription.
 */
export async function openBillingPortal(customerId) {
  const { url } = await apiPost('/subscriptions/portal', { customerId })
  window.location.href = url
}

// ─── Buyer checkout ───────────────────────────────────────────────────────────

/**
 * Create a PaymentIntent for a buyer purchasing a listing.
 * Returns { clientSecret } which you pass to Stripe Elements to collect
 * card details without the card number ever touching your server.
 */
export async function createListingPayment({
  listingId,
  listingName,
  amountCents,
  sellerAccountId,
  buyerEmail,
}) {
  return apiPost('/checkout/create', {
    listingId,
    listingName,
    amountCents,
    sellerAccountId,
    buyerEmail,
  })
}

// ─── Listing boosts ───────────────────────────────────────────────────────────

/**
 * Send seller to Stripe Checkout to purchase a listing boost.
 * boostType: 'boost_7' | 'boost_30'
 */
export async function purchaseListingBoost({ boostType, listingId, sellerId }) {
  const { url } = await apiPost('/boosts/checkout', { boostType, listingId, sellerId })
  window.location.href = url
}
