import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sellerId, email, businessName } = req.body

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { name: businessName },
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
      metadata: { homestead_seller_id: sellerId },
    })

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.VITE_APP_URL}/seller/onboard/refresh`,
      return_url:  `${process.env.VITE_APP_URL}/seller/onboard/complete`,
      type: 'account_onboarding',
    })

    res.status(200).json({ url: accountLink.url, accountId: account.id })
  } catch (err) {
    console.error('Onboard error:', err)
    res.status(500).json({ error: err.message })
  }
}
