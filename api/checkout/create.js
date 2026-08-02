import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLATFORM_FEE_PERCENT = 5

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { listingId, listingName, amountCents, sellerAccountId, buyerEmail } = req.body

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'Amount must be at least $0.50' })
    }

    const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100))

    const paymentIntent = await stripe.paymentIntents.create({
      amount:   amountCents,
      currency: 'usd',
      receipt_email: buyerEmail,
      transfer_data: {
        destination: sellerAccountId,
      },
      application_fee_amount: platformFeeCents,
      metadata: {
        listing_id:   listingId,
        listing_name: listingName,
      },
    })

    res.status(200).json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}
