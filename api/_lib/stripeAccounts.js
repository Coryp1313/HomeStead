/**
 * Homestead — create Stripe Connect accounts with Accounts v2
 *
 * Stripe no longer lets new Connect platforms create accounts with the old
 * v1 API (stripe.accounts.create). The Node library we use doesn't cover v2
 * yet, so this calls the v2 endpoint directly.
 *
 * Accounts created here still work with the v1 endpoints we use elsewhere
 * (account links, retrieve, login links): Stripe accepts a v2 account ID on
 * v1 endpoints and answers in the v1 shape.
 */

// Express dashboard + Stripe-managed risk needs Stripe's preview API version
const STRIPE_V2_VERSION = '2026-10-28.preview'

export async function createExpressAccount({ email, businessName, sellerId }) {
  const res = await fetch('https://api.stripe.com/v2/core/accounts', {
    method:  'POST',
    headers: {
      Authorization:    `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Stripe-Version': STRIPE_V2_VERSION,
      'Content-Type':   'application/json',
    },
    body: JSON.stringify({
      display_name:  businessName,
      contact_email: email,
      identity:      { country: 'US' },
      dashboard:     'express',
      // Stripe covers fraud losses and collects its own fees ("managed risk"),
      // so Homestead isn't on the hook if a seller's account goes negative.
      defaults: {
        responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' },
      },
      configuration: {
        merchant:  { capabilities: { card_payments: { requested: true } } },
        recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
      },
      metadata: { homestead_seller_id: sellerId },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe account creation failed (${res.status})`)
  }
  return data   // data.id is the acct_… ID
}
