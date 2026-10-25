-- ─────────────────────────────────────────────────────────────────────────────
-- Homestead — database setup
--
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It's safe to run more than once.
--
-- Tables:
--   profiles  — one row per account (name, email)
--   sellers   — one row per farm / business, owned by an account
--   listings  — the goods a seller has for sale
--
-- Row Level Security (RLS) means the browser can only read/write what the
-- rules below allow. Anything sensitive (Stripe account IDs, plans,
-- verification) is only changed by our Vercel functions using the secret
-- service-role key, never from the browser.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Profiles ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Read own profile"   on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
create policy "Read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);

-- Create a profile automatically whenever someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── Sellers ─────────────────────────────────────────────────────────────────

create table if not exists public.sellers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique references auth.users(id) on delete cascade,
  business_name       text not null,
  location            text not null default '',
  goods               text not null default '',
  emoji               text not null default '🌾',
  bg                  text not null default '#EAF3DE',
  dist                numeric,
  rating              numeric,
  reviews             integer not null default 0,
  verified            boolean not null default false,
  stripe_account_id   text unique,
  stripe_customer_id  text,
  plan                text not null default 'sprout' check (plan in ('sprout', 'grower', 'harvest')),
  plan_status         text not null default 'active',
  is_sample           boolean not null default false,
  created_at          timestamptz not null default now()
);

alter table public.sellers enable row level security;

drop policy if exists "Anyone can view sellers"   on public.sellers;
drop policy if exists "Update own seller profile" on public.sellers;
create policy "Anyone can view sellers"   on public.sellers for select using (true);
create policy "Update own seller profile" on public.sellers for update using (auth.uid() = user_id);

-- Sellers may edit their public details, but not their plan, Stripe IDs or
-- verified badge. New seller rows are created by /api/connect/onboard.
revoke insert, update, delete on public.sellers from anon, authenticated;
grant  update (business_name, location, goods, emoji) on public.sellers to authenticated;


-- ── Listings ────────────────────────────────────────────────────────────────

create table if not exists public.listings (
  id                uuid primary key default gen_random_uuid(),
  seller_id         uuid not null references public.sellers(id) on delete cascade,
  name              text not null,
  description       text not null default '',
  price             numeric(10,2) not null check (price >= 0.50),
  unit              text not null default 'each',
  category          text not null check (category in ('eggs', 'honey', 'meat', 'dairy', 'produce', 'preserves')),
  emoji             text not null default '🌾',
  bg                text not null default 'bg-green',
  tags              text[] not null default '{}',
  photo_url         text,
  boosted           boolean not null default false,
  boost_expires_at  timestamptz,
  active            boolean not null default true,
  is_sample         boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists listings_seller_id_idx on public.listings (seller_id);

alter table public.listings enable row level security;

drop policy if exists "Anyone can view active listings" on public.listings;
drop policy if exists "Sellers add own listings"        on public.listings;
drop policy if exists "Sellers edit own listings"       on public.listings;
drop policy if exists "Sellers delete own listings"     on public.listings;

create policy "Anyone can view active listings" on public.listings for select
  using (active or seller_id in (select id from public.sellers where user_id = auth.uid()));

create policy "Sellers add own listings" on public.listings for insert
  with check (seller_id in (select id from public.sellers where user_id = auth.uid()));

create policy "Sellers edit own listings" on public.listings for update
  using (seller_id in (select id from public.sellers where user_id = auth.uid()));

create policy "Sellers delete own listings" on public.listings for delete
  using (seller_id in (select id from public.sellers where user_id = auth.uid()));

-- Sellers can't give themselves a free boost or mark their own listing as a sample
revoke insert, update on public.listings from anon, authenticated;
grant  insert (seller_id, name, description, price, unit, category, emoji, bg, tags, photo_url, active)
  on public.listings to authenticated;
grant  update (name, description, price, unit, category, emoji, bg, tags, photo_url, active)
  on public.listings to authenticated;


-- ── Listing photos (Storage) ────────────────────────────────────────────────
-- Public bucket: anyone can view photos. Signed-in users can only upload
-- into a folder named after their own account ID.

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view listing photos" on storage.objects;
drop policy if exists "Upload own listing photos"      on storage.objects;
drop policy if exists "Delete own listing photos"      on storage.objects;

create policy "Anyone can view listing photos" on storage.objects for select
  using (bucket_id = 'listing-photos');

create policy "Upload own listing photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Delete own listing photos" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);


-- ── Sample data ─────────────────────────────────────────────────────────────
-- The six demo farms and twelve listings, marked is_sample so buyers can't
-- check out on them. When real farms have joined, remove them all with:
--
--   delete from public.sellers where is_sample;

insert into public.sellers (id, business_name, location, goods, emoji, bg, dist, rating, reviews, verified, plan, is_sample) values
  ('00000000-0000-0000-0000-000000000001', 'Sunridge Farm',       'Fort Collins, CO', 'Eggs, Poultry, Produce',       '🌾', '#EAF3DE', 3.2, 4.9, 47, true,  'harvest', true),
  ('00000000-0000-0000-0000-000000000002', 'Mesa Bees Co.',       'Loveland, CO',     'Honey, Beeswax, Candles',      '🐝', '#FAEEDA', 5.8, 5.0, 31, true,  'grower',  true),
  ('00000000-0000-0000-0000-000000000003', 'Poudre Valley Ranch', 'LaPorte, CO',      'Beef, Pork, Lamb',             '🐄', '#FAECE7', 8.1, 4.8, 62, true,  'harvest', true),
  ('00000000-0000-0000-0000-000000000004', 'Happy Hooves',        'Timnath, CO',      'Goat milk, Cheese, Yogurt',    '🐐', '#E1F5EE', 4.4, 4.7, 18, false, 'sprout',  true),
  ('00000000-0000-0000-0000-000000000005', 'Dirt & Dew Garden',   'Fort Collins, CO', 'Heirloom veg, Herbs, Flowers', '🌿', '#EAF3DE', 2.1, 4.9, 83, true,  'grower',  true),
  ('00000000-0000-0000-0000-000000000006', 'Kitchen Roots',       'Windsor, CO',      'Jams, Pickles, Ferments',      '🫙', '#FAECE7', 6.3, 4.8, 29, true,  'grower',  true)
on conflict (id) do nothing;

insert into public.listings (id, seller_id, name, price, unit, category, emoji, bg, tags, boosted, is_sample) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Farm-fresh brown eggs',  6.50,  'per dozen',  'eggs',      '🥚', 'bg-amber', '{Pasture-raised,Non-GMO}',  false, true),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000002', 'Raw wildflower honey',   14.00, 'per pint',   'honey',     '🍯', 'bg-amber', '{Raw,Organic}',             true,  true),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000003', 'Grass-fed ground beef',  9.00,  'per lb',     'meat',      '🥩', 'bg-coral', '{Grass-fed,Organic}',       false, true),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000004', 'Fresh goat milk',        5.00,  'per quart',  'dairy',     '🥛', 'bg-teal',  '{Raw,"Herd share"}',        false, true),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000005', 'Heirloom tomatoes',      4.00,  'per lb',     'produce',   '🍅', 'bg-coral', '{Heirloom,Organic}',        false, true),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000006', 'Organic strawberry jam', 8.00,  'per jar',    'preserves', '🍓', 'bg-coral', '{Organic,"Small batch"}',   false, true),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'Pasture-raised chicken', 7.00,  'per lb',     'meat',      '🍗', 'bg-amber', '{Pasture-raised,Organic}',  false, true),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000002', 'Pure beeswax candles',   12.00, 'per piece',  'honey',     '🕯️', 'bg-amber', '{Beeswax,Handmade}',        false, true),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000005', 'Fresh lacinato kale',    3.50,  'per bundle', 'produce',   '🥬', 'bg-green', '{Organic,No-spray}',        false, true),
  ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000004', 'Aged goat cheddar',      11.00, 'per lb',     'dairy',     '🧀', 'bg-amber', '{Artisan,"Raw milk"}',      false, true),
  ('00000000-0000-0000-0001-000000000011', '00000000-0000-0000-0000-000000000002', 'Wildflower honeycomb',   18.00, 'per piece',  'honey',     '🍯', 'bg-amber', '{Raw,"Comb honey"}',        false, true),
  ('00000000-0000-0000-0001-000000000012', '00000000-0000-0000-0000-000000000003', 'Pastured pork chops',    8.50,  'per lb',     'meat',      '🥩', 'bg-coral', '{Pasture-raised,Organic}',  false, true)
on conflict (id) do nothing;
