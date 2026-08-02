import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(req.body.accountId)
    res.status(200).json({ url: loginLink.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
