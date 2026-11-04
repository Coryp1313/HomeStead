-- Homestead — add the orders table.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- It is safe to run more than once. (It is also included in schema.sql.)

-- ── Orders ──────────────────────────────────────────────────────────────────
-- One row per paid purchase. Rows are only ever created by our Vercel
-- functions after Stripe confirms the payment, so nobody can fake an order
-- from their browser. Buyers see their own orders; sellers see orders for
-- their farm and can mark them picked up.

create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),
  buyer_id                  uuid references auth.users(id) on delete set null,
  seller_id                 uuid references public.sellers(id) on delete set null,
  listing_id                uuid references public.listings(id) on delete set null,
  stripe_payment_intent_id  text not null unique,
  listing_name              text not null,
  listing_emoji             text not null default '🌾',
  unit                      text not null default 'each',
  amount                    numeric(10,2) not null,
  platform_fee              numeric(10,2) not null default 0,
  buyer_name                text not null default '',
  buyer_email               text not null default '',
  status                    text not null default 'paid' check (status in ('paid', 'picked_up', 'refunded')),
  created_at                timestamptz not null default now(),
  picked_up_at              timestamptz
);

create index if not exists orders_buyer_id_idx  on public.orders (buyer_id);
create index if not exists orders_seller_id_idx on public.orders (seller_id);

alter table public.orders enable row level security;

drop policy if exists "Buyers and sellers view their orders" on public.orders;
drop policy if exists "Sellers mark orders picked up"        on public.orders;

create policy "Buyers and sellers view their orders" on public.orders for select
  using (buyer_id = auth.uid()
         or seller_id in (select id from public.sellers where user_id = auth.uid()));

create policy "Sellers mark orders picked up" on public.orders for update
  using      (seller_id in (select id from public.sellers where user_id = auth.uid()))
  with check (seller_id in (select id from public.sellers where user_id = auth.uid())
              and status in ('paid', 'picked_up'));

revoke insert, update, delete on public.orders from anon, authenticated;
grant  select                        on public.orders to authenticated;
grant  update (status, picked_up_at) on public.orders to authenticated;
grant  all                           on public.orders to service_role;
