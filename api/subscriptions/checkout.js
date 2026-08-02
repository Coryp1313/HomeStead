import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLANS = {
  grower:  { priceId: process.env.STRIPE_PRICE_GROWER,  name: 'Grower'  },
  harvest: { priceId: process.env.STRIPE_PRICE_HARVEST, name: 'Harvest' },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { plan, sellerId, email } = req.body
    const selectedPlan = PLANS[plan]

    if (!selectedPlan) {
      return res.status(400).json({ error: 'Invalid plan. Must be "grower" or "harvest".' })
    }

    if (!selectedPlan.priceId) {
      return res.status(500).json({
        error: `Price ID for "${plan}" plan is not set. Add STRIPE_PRICE_${plan.toUpperCase()} to your Vercel environment variables.`
      })
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
        trial_period_days: 14,
      },
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Subscription checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}
