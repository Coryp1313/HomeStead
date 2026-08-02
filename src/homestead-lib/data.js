/**
 * Homestead — Listing & Seller Data
 *
 * In production this comes from your database via API calls.
 * sellerAccountId maps to each seller's Stripe Connect account ID.
 */

export const SELLERS = [
  {
    id:              'seller_sunridge',
    name:            'Sunridge Farm',
    stripeAccountId: 'acct_sunridge_demo',  // replace with real acct_ IDs
    location:        'Fort Collins, CO',
    dist:            3.2,
    emoji:           '🌾',
    bg:              '#EAF3DE',
    verified:        true,
    rating:          4.9,
    reviews:         47,
    goods:           'Eggs, Poultry, Produce',
    plan:            'harvest',
  },
  {
    id:              'seller_mesa',
    name:            'Mesa Bees Co.',
    stripeAccountId: 'acct_mesa_demo',
    location:        'Loveland, CO',
    dist:            5.8,
    emoji:           '🐝',
    bg:              '#FAEEDA',
    verified:        true,
    rating:          5.0,
    reviews:         31,
    goods:           'Honey, Beeswax, Candles',
    plan:            'grower',
  },
  {
    id:              'seller_poudre',
    name:            'Poudre Valley Ranch',
    stripeAccountId: 'acct_poudre_demo',
    location:        'LaPorte, CO',
    dist:            8.1,
    emoji:           '🐄',
    bg:              '#FAECE7',
    verified:        true,
    rating:          4.8,
    reviews:         62,
    goods:           'Beef, Pork, Lamb',
    plan:            'harvest',
  },
  {
    id:              'seller_hooves',
    name:            'Happy Hooves',
    stripeAccountId: 'acct_hooves_demo',
    location:        'Timnath, CO',
    dist:            4.4,
    emoji:           '🐐',
    bg:              '#E1F5EE',
    verified:        false,
    rating:          4.7,
    reviews:         18,
    goods:           'Goat milk, Cheese, Yogurt',
    plan:            'sprout',
  },
  {
    id:              'seller_dirtdew',
    name:            'Dirt & Dew Garden',
    stripeAccountId: 'acct_dirtdew_demo',
    location:        'Fort Collins, CO',
    dist:            2.1,
    emoji:           '🌿',
    bg:              '#EAF3DE',
    verified:        true,
    rating:          4.9,
    reviews:         83,
    goods:           'Heirloom veg, Herbs, Flowers',
    plan:            'grower',
  },
  {
    id:              'seller_kitchen',
    name:            'Kitchen Roots',
    stripeAccountId: 'acct_kitchen_demo',
    location:        'Windsor, CO',
    dist:            6.3,
    emoji:           '🫙',
    bg:              '#FAECE7',
    verified:        true,
    rating:          4.8,
    reviews:         29,
    goods:           'Jams, Pickles, Ferments',
    plan:            'grower',
  },
]

export const LISTINGS = [
  { id:'l1',  name:'Farm-fresh brown eggs',    sellerId:'seller_sunridge', price:6.50,  unit:'per dozen',  category:'eggs',     emoji:'🥚', bg:'bg-amber', tags:['Pasture-raised','Non-GMO'],     boosted:false },
  { id:'l2',  name:'Raw wildflower honey',     sellerId:'seller_mesa',     price:14.00, unit:'per pint',   category:'honey',    emoji:'🍯', bg:'bg-amber', tags:['Raw','Organic'],                boosted:true  },
  { id:'l3',  name:'Grass-fed ground beef',    sellerId:'seller_poudre',   price:9.00,  unit:'per lb',     category:'meat',     emoji:'🥩', bg:'bg-coral', tags:['Grass-fed','Organic'],          boosted:false },
  { id:'l4',  name:'Fresh goat milk',          sellerId:'seller_hooves',   price:5.00,  unit:'per quart',  category:'dairy',    emoji:'🥛', bg:'bg-teal',  tags:['Raw','Herd share'],            boosted:false },
  { id:'l5',  name:'Heirloom tomatoes',        sellerId:'seller_dirtdew',  price:4.00,  unit:'per lb',     category:'produce',  emoji:'🍅', bg:'bg-coral', tags:['Heirloom','Organic'],          boosted:false },
  { id:'l6',  name:'Organic strawberry jam',   sellerId:'seller_kitchen',  price:8.00,  unit:'per jar',    category:'preserves',emoji:'🍓', bg:'bg-coral', tags:['Organic','Small batch'],       boosted:false },
  { id:'l7',  name:'Pasture-raised chicken',   sellerId:'seller_sunridge', price:7.00,  unit:'per lb',     category:'meat',     emoji:'🍗', bg:'bg-amber', tags:['Pasture-raised','Organic'],    boosted:false },
  { id:'l8',  name:'Pure beeswax candles',     sellerId:'seller_mesa',     price:12.00, unit:'per piece',  category:'honey',    emoji:'🕯️', bg:'bg-amber', tags:['Beeswax','Handmade'],          boosted:false },
  { id:'l9',  name:'Fresh lacinato kale',      sellerId:'seller_dirtdew',  price:3.50,  unit:'per bundle', category:'produce',  emoji:'🥬', bg:'bg-green', tags:['Organic','No-spray'],          boosted:false },
  { id:'l10', name:'Aged goat cheddar',        sellerId:'seller_hooves',   price:11.00, unit:'per lb',     category:'dairy',    emoji:'🧀', bg:'bg-amber', tags:['Artisan','Raw milk'],          boosted:false },
  { id:'l11', name:'Wildflower honeycomb',     sellerId:'seller_mesa',     price:18.00, unit:'per piece',  category:'honey',    emoji:'🍯', bg:'bg-amber', tags:['Raw','Comb honey'],            boosted:false },
  { id:'l12', name:'Pastured pork chops',      sellerId:'seller_poudre',   price:8.50,  unit:'per lb',     category:'meat',     emoji:'🥩', bg:'bg-coral', tags:['Pasture-raised','Organic'],    boosted:false },
]

// Enrich listings with seller data (denormalised for convenience)
export const LISTINGS_WITH_SELLER = LISTINGS.map(l => ({
  ...l,
  seller:          SELLERS.find(s => s.id === l.sellerId),
  sellerAccountId: SELLERS.find(s => s.id === l.sellerId)?.stripeAccountId,
}))
