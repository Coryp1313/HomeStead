-- Homestead: listing limits per plan. Paste into Supabase SQL Editor and click Run.
-- Safe to run more than once. The same SQL is also in schema.sql.
-- Sprout (free): 3 active listings. Grower: 25. Harvest: no limit.
-- A paid plan only counts while its subscription is active or in its trial.

create or replace function public.check_listing_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
plan_name text;
plan_state text;
max_active int;
active_count int;
begin
if not new.active or new.is_sample then
return new;
end if;
if tg_op = 'UPDATE' and old.active and old.seller_id = new.seller_id then
return new;
end if;

select plan, plan_status into plan_name, plan_state from public.sellers where id = new.seller_id;

if plan_state in ('active', 'trialing') and plan_name = 'harvest' then
return new;
elsif plan_state in ('active', 'trialing') and plan_name = 'grower' then
max_active := 25;
plan_name := 'Grower';
else
max_active := 3;
plan_name := 'free Sprout';
end if;

perform pg_advisory_xact_lock(hashtext(new.seller_id::text));
select count(*) into active_count from public.listings
where seller_id = new.seller_id and active and id <> new.id;

if active_count >= max_active then
raise exception 'The % plan allows % active listings. Hide one, or upgrade your plan to add more.', plan_name, max_active;
end if;
return new;
end;
$$;

drop trigger if exists listings_limit on public.listings;
create trigger listings_limit
before insert or update of active, seller_id on public.listings
for each row execute function public.check_listing_limit();
