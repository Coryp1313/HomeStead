import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const BOOST_PRICES = {
  boost_7:  { priceId: process.env.STRIPE_PRICE_BOOST_7,  amount: 500,  label: '7-day listing boost'  },
  boost_30: { priceId: process.env.STRIPE_PRICE_BOOST_30, amount: 2500, label: '30-day listing boost' },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { boostType, listingId, sellerId } = req.body
    const boost = BOOST_PRICES[boostType]

    if (!boost) {
      return res.status(400).json({ error: 'Invalid boost type. Must be "boost_7" or "boost_30".' })
    }

    const lineItem = boost.priceId
      ? { price: boost.priceId, quantity: 1 }
      : {
          price_data: {
            currency:     'usd',
            unit_amount:  boost.amount,
            product_data: { name: boost.label },
          },
          quantity: 1,
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [lineItem],
      success_url: `${process.env.VITE_APP_URL}/seller/boost/success?listing=${listingId}`,
      cancel_url:  `${process.env.VITE_APP_URL}/seller/listings`,
      metadata: { listing_id: listingId, seller_id: sellerId, boost_type: boostType },
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Boost checkout error:', err)
    res.status(500).json({ error: err.message })
  }
}
