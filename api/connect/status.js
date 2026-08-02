import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { accountId } = req.query
    const account = await stripe.accounts.retrieve(accountId)

    res.status(200).json({
      isActive:        account.charges_enabled && account.payouts_enabled,
      chargesEnabled:  account.charges_enabled,
      payoutsEnabled:  account.payouts_enabled,
      requirementsDue: account.requirements?.currently_due ?? [],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
