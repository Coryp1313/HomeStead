/**
 * Homestead — Express API Server
 *
 * Handles all Stripe interactions:
 *   - Seller onboarding via Stripe Connect Express
 *   - Subscription checkout (Grower / Harvest plans)
 *   - Buyer checkout with automatic platform fee split
 *   - Listing boost one-time payments
 *   - Webhooks to keep your DB in sync with Stripe events
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'

const app = express()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({ origin: process.env.VITE_APP_URL }))

// Webhooks need the raw body — register BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)

app.use(express.json())

// ─── Stripe Product & Price IDs ──────────────────────────────────────────────
// Create these once in your Stripe Dashboard under Products, then paste the
// price IDs here. Example IDs shown — replace with your real ones.
const PLANS = {
  grower:  { priceId: 'prod_UzUGciLiIrSXRP',  name: 'Grower',  amount: 1900 },
  harvest: { priceId: 'prod_UzUHrByvmivQvy', name: 'Harvest', amount: 4900 },
}

const BOOST_PRICES = {
  boost_7:  { priceId: 'prod_UzUI7cPFS2sGaK',  amount: 500,  label: '7-day boost'  },
  boost_30: { priceId: 'prod_UzUIxetoRg10ei', amount: 2500, label: '30-day boost' },
}

// Platform fee Homestead takes on every buyer transaction (5%)
const PLATFORM_FEE_PERCENT = 5

// ─── 1. Seller Onboarding — Stripe Connect Express ───────────────────────────

/**
 * POST /api/connect/onboard
 * Creates a Stripe Connect Express account for a new seller and returns
 * an onboarding link. The seller completes KYC on Stripe's hosted page —
 * you never touch their banking details.
 *
 * Body: { sellerId: string, email: string, businessName: string }
 */
app.post('/api/connect/onboard', async (req, res) => {
  try {
    const { sellerId, email, businessName } = req.body

    // Create a Connect Express account for this seller
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { name: businessName },
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
      // Store your internal seller ID so you can look it up later
      metadata: { homestead_seller_id: sellerId },
    })

    // Save account.id to your database linked to sellerId here
    // e.g. await db.sellers.update({ id: sellerId }, { stripeAccountId: account.id })

    // Generate the onboarding link — valid for 1 hour
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.VITE_APP_URL}/seller/onboard/refresh`,
      return_url:  `${process.env.VITE_APP_URL}/seller/onboard/complete`,
      type: 'account_onboarding',
    })

    res.json({ url: accountLink.url, accountId: account.id })
  } catch (err) {
    console.error('Onboard error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/connect/status/:accountId
 * Check whether a seller has finished onboarding and can accept payments.
 */
app.get('/api/connect/status/:accountId', async (req, res) => {
  try {
    const account = await stripe.accounts.retrieve(req.params.accountId)
    res.json({
      isActive:        account.charges_enabled && account.payouts_enabled,
      chargesEnabled:  account.charges_enabled,
      payoutsEnabled:  account.payouts_enabled,
      requirementsDue: account.requirements?.currently_due ?? [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/connect/dashboard-link
 * Returns a link to the seller's Stripe Express dashboard so they can
 * view their payouts and account details.
 *
 * Body: { accountId: string }
 */
app.post('/api/connect/dashboard-link', async (req, res) => {
  try {
    const loginLink = await stripe.accounts.createLoginLink(req.body.accountId)
    res.json({ url: loginLink.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── 2. Seller Subscriptions — Stripe Billing ────────────────────────────────

/**
 * POST /api/subscriptions/checkout
 * Creates a Stripe Checkout session for a seller to subscribe to
 * the Grower ($19/mo) or Harvest ($49/mo) plan.
 *
 * Body: { plan: 'grower' | 'harvest', sellerId: string, email: string }
 */
app.post('/api/subscriptions/checkout', async (req, res) => {
  try {
    const { plan, sellerId, email } = req.body
    const selectedPlan = PLANS[plan]

    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      success_url: `${process.env.VITE_APP_URL}/seller/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.VITE_APP_URL}/seller/plans`,
      metadata: { homestead_seller_id: sellerId, plan },
      subscription_data: {
        metadata: { homestead_seller_id: sellerId, plan },
        trial_period_days: 14, // 14-day free trial to reduce friction
      },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Subscription checkout error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/subscriptions/portal
 * Opens the Stripe Customer Portal so sellers can manage/cancel their plan.
 *
 * Body: { customerId: string }
 */
app.post('/api/subscriptions/portal', async (req, res) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   req.body.customerId,
      return_url: `${process.env.VITE_APP_URL}/seller/dashboard`,
    })
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── 3. Buyer Checkout — with platform fee split ──────────────────────────────

/**
 * POST /api/checkout/create
 * Creates a PaymentIntent for a buyer purchasing a listing.
 * Homestead automatically takes a 5% platform fee; the rest goes to the seller.
 *
 * Body: {
 *   listingId:       string,
 *   listingName:     string,
 *   amountCents:     number,   // e.g. 650 for $6.50
 *   sellerAccountId: string,   // the seller's Stripe Connect account ID
 *   buyerEmail:      string,
 * }
 */
app.post('/api/checkout/create', async (req, res) => {
  try {
    const { listingId, listingName, amountCents, sellerAccountId, buyerEmail } = req.body

    const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100))

    // destination charge: Stripe charges the buyer, takes the platform fee,
    // and transfers the remainder to the seller's Connected account automatically
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'usd',
      receipt_email: buyerEmail,
      transfer_data: {
        destination: sellerAccountId,     // seller's Connect account
      },
      application_fee_amount: platformFeeCents, // Homestead's cut
      metadata: {
        listing_id:   listingId,
        listing_name: listingName,
      },
    })

    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── 4. Listing Boosts — one-time payments ───────────────────────────────────

/**
 * POST /api/boosts/checkout
 * Creates a Checkout session for a seller to purchase a listing boost.
 *
 * Body: { boostType: 'boost_7' | 'boost_30', listingId: string, sellerId: string }
 */
app.post('/api/boosts/checkout', async (req, res) => {
  try {
    const { boostType, listingId, sellerId } = req.body
    const boost = BOOST_PRICES[boostType]

    if (!boost) {
      return res.status(400).json({ error: 'Invalid boost type' })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency:     'usd',
          unit_amount:  boost.amount,
          product_data: { name: boost.label },
        },
        quantity: 1,
      }],
      success_url: `${process.env.VITE_APP_URL}/seller/boost/success?listing=${listingId}`,
      cancel_url:  `${process.env.VITE_APP_URL}/seller/listings`,
      metadata: { listing_id: listingId, seller_id: sellerId, boost_type: boostType },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Boost checkout error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ─── 5. Webhooks — keep your database in sync ────────────────────────────────

/**
 * Stripe sends events to this endpoint whenever something important happens.
 * Verify the signature to ensure the request is genuinely from Stripe,
 * then update your database accordingly.
 *
 * Test locally with:  stripe listen --forward-to localhost:4000/webhook
 */
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Received Stripe event: ${event.type}`)

  switch (event.type) {

    // ── Seller completed Connect onboarding ──────────────────────────────────
    case 'account.updated': {
      const account = event.data.object
      if (account.charges_enabled) {
        // Update seller in DB: mark as verified & ready to sell
        console.log(`Seller ${account.metadata.homestead_seller_id} is now verified`)
        // await db.sellers.update({ stripeAccountId: account.id }, { status: 'active' })
      }
      break
    }

    // ── Subscription started / renewed ──────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object
      const sellerId = sub.metadata.homestead_seller_id
      const plan     = sub.metadata.plan
      const status   = sub.status // 'active', 'trialing', 'past_due', etc.
      console.log(`Seller ${sellerId} subscription ${status} on ${plan} plan`)
      // await db.sellers.update({ id: sellerId }, { plan, subscriptionStatus: status })
      break
    }

    // ── Subscription cancelled ───────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub      = event.data.object
      const sellerId = sub.metadata.homestead_seller_id
      console.log(`Seller ${sellerId} cancelled their subscription`)
      // await db.sellers.update({ id: sellerId }, { plan: 'sprout', subscriptionStatus: 'cancelled' })
      break
    }

    // ── Buyer payment succeeded ──────────────────────────────────────────────
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      console.log(`Buyer paid $${pi.amount / 100} for listing ${pi.metadata.listing_name}`)
      // await db.orders.create({ listingId: pi.metadata.listing_id, amount: pi.amount, status: 'paid' })
      break
    }

    // ── Listing boost purchased ──────────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.metadata?.boost_type) {
        const { listing_id, seller_id, boost_type } = session.metadata
        const days = boost_type === 'boost_7' ? 7 : 30
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        console.log(`Listing ${listing_id} boosted for ${days} days until ${expiresAt}`)
        // await db.listings.update({ id: listing_id }, { boosted: true, boostExpiresAt: expiresAt })
      }
      break
    }

    // ── Payment failed — notify buyer ────────────────────────────────────────
    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      console.log(`Payment failed for ${pi.receipt_email}: ${pi.last_payment_error?.message}`)
      // Send failure email to buyer
      break
    }

    default:
      // Ignore events you don't handle
      break
  }

  res.json({ received: true })
}

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Homestead server running on http://localhost:${PORT}`)
})
