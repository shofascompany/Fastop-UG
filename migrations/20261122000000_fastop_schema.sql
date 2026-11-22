-- =====================================================================
-- Fastop database schema (Supabase / PostgreSQL)
--
-- How to apply:
--   Supabase Dashboard → SQL Editor → New query → paste this file → Run
--   (or with the Supabase CLI:  supabase db push)
--
-- Security model:
--   Every table has Row Level Security ON with NO policies, so the public
--   "anon" key can read/write nothing. Only the Fastop API server, using the
--   secret service_role key from .env, can access the data. The browser
--   always goes through the API, which checks who is allowed to do what.
--
-- IDs are short text ids made by the app (e.g. "prd_k3j9x0a1b2"), so pages
-- can update instantly before the server confirms.
-- =====================================================================

-- ---------- Accounts ----------
create table if not exists public.app_users (
  id            text primary key,
  email         text not null,
  name          text not null default '',
  role          text not null default 'customer' check (role in ('customer', 'shop', 'admin')),
  status        text not null default 'active'   check (status in ('active', 'suspended')),
  verified      boolean not null default false,
  password_hash text not null,                      -- scrypt "salt:hash", never the password
  created_at    timestamptz not null default now()
);
create unique index if not exists app_users_email_key on public.app_users (lower(email));
-- There can only ever be ONE Control Centre (admin) account.
create unique index if not exists app_users_single_admin on public.app_users (role) where role = 'admin';

-- Pending 6-digit email codes (stored only as a keyed hash)
create table if not exists public.verification_codes (
  email      text primary key,
  code_hash  text not null,
  expires_at timestamptz not null,
  attempts   integer not null default 0 check (attempts >= 0),
  sent_at    timestamptz not null default now()
);

-- ---------- Shops ----------
create table if not exists public.shops (
  id          text primary key,
  owner_id    text not null references public.app_users (id) on delete cascade,
  name        text not null,
  category    text not null default 'other',
  description text not null default '',
  phone       text not null default '',
  email       text not null default '',
  address     text not null default '',
  hours       text not null default '',
  lat         double precision,
  lng         double precision,
  status      text not null default 'pending' check (status in ('active', 'pending', 'suspended')),
  created_at  timestamptz not null default now()
);
create index if not exists shops_owner_idx  on public.shops (owner_id);
create index if not exists shops_status_idx on public.shops (status);

-- ---------- Products ----------
create table if not exists public.products (
  id          text primary key,
  shop_id     text not null references public.shops (id) on delete cascade,
  name        text not null,
  category    text not null default 'other',
  description text not null default '',
  price       numeric(14, 2) not null default 0 check (price >= 0),
  cost        numeric(14, 2) not null default 0 check (cost >= 0),
  stock       integer not null default 0 check (stock >= 0),
  sku         text not null default '',
  image       text not null default '',
  visible     boolean not null default true,
  featured    boolean not null default false,
  views       integer not null default 0 check (views >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists products_shop_idx     on public.products (shop_id);
create index if not exists products_public_idx   on public.products (visible, category);
create index if not exists products_created_idx  on public.products (created_at desc);

-- ---------- Sales (point of sale) ----------
create table if not exists public.sales (
  id             text primary key,
  shop_id        text not null references public.shops (id) on delete cascade,
  items          jsonb not null default '[]'::jsonb,  -- [{productId, name, qty, price, cost}]
  total          numeric(14, 2) not null default 0 check (total >= 0),
  payment_method text not null default 'Cash',
  customer_name  text not null default '',
  created_at     timestamptz not null default now()
);
create index if not exists sales_shop_time_idx on public.sales (shop_id, created_at desc);

-- ---------- Expenses ----------
create table if not exists public.expenses (
  id       text primary key,
  shop_id  text not null references public.shops (id) on delete cascade,
  title    text not null,
  category text not null default 'Other',
  amount   numeric(14, 2) not null default 0 check (amount >= 0),
  date     timestamptz not null default now()
);
create index if not exists expenses_shop_date_idx on public.expenses (shop_id, date desc);

-- ---------- Customer enquiries ----------
create table if not exists public.enquiries (
  id          text primary key,
  shop_id     text not null references public.shops (id) on delete cascade,
  product_id  text references public.products (id) on delete set null,
  customer_id text not null references public.app_users (id) on delete cascade,
  message     text not null,
  reply       text not null default '',
  status      text not null default 'new' check (status in ('new', 'replied')),
  created_at  timestamptz not null default now(),
  replied_at  timestamptz
);
create index if not exists enquiries_shop_idx     on public.enquiries (shop_id, created_at desc);
create index if not exists enquiries_customer_idx on public.enquiries (customer_id, created_at desc);

-- ---------- Saved products (favourites) ----------
create table if not exists public.favorites (
  user_id    text not null references public.app_users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index if not exists favorites_product_idx on public.favorites (product_id);

-- ---------- Activity log (Control Centre) ----------
create table if not exists public.activity (
  id      text primary key,
  type    text not null default 'system',
  message text not null,
  at      timestamptz not null default now()
);
create index if not exists activity_at_idx on public.activity (at desc);

-- ---------- Platform settings (a single row) ----------
create table if not exists public.settings (
  id   text primary key default 'platform' check (id = 'platform'),
  data jsonb not null default '{}'::jsonb
);
insert into public.settings (id, data)
values ('platform', jsonb_build_object(
  'appName', 'Fastop',
  'currency', 'UGX',
  'allowShopSignup', true,
  'requireShopApproval', true,
  'announcement', '',
  'mapCenter', jsonb_build_array(0.3476, 32.5825),
  'supportEmail', ''
))
on conflict (id) do nothing;

-- =====================================================================
-- Functions (atomic operations the API calls)
-- =====================================================================

-- Record a sale and reduce stock in ONE transaction (never sells stock twice).
create or replace function public.record_sale(
  p_id text, p_shop_id text, p_items jsonb, p_payment_method text, p_customer_name text
) returns public.sales
language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  v_total numeric(14, 2) := 0;
  v_sale public.sales;
begin
  for it in select * from jsonb_array_elements(p_items) loop
    v_total := v_total + (it->>'qty')::numeric * (it->>'price')::numeric;
    update public.products
       set stock = greatest(0, stock - (it->>'qty')::int)
     where id = it->>'productId' and shop_id = p_shop_id;
  end loop;
  insert into public.sales (id, shop_id, items, total, payment_method, customer_name)
  values (p_id, p_shop_id, p_items, v_total, coalesce(p_payment_method, 'Cash'), coalesce(p_customer_name, ''))
  returning * into v_sale;
  return v_sale;
end $$;

-- Void a sale, optionally putting the items back into stock.
create or replace function public.void_sale(p_id text, p_restock boolean default true)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_sale public.sales;
  it jsonb;
begin
  select * into v_sale from public.sales where id = p_id for update;
  if not found then return; end if;
  if p_restock then
    for it in select * from jsonb_array_elements(v_sale.items) loop
      update public.products set stock = stock + (it->>'qty')::int
       where id = it->>'productId' and shop_id = v_sale.shop_id;
    end loop;
  end if;
  delete from public.sales where id = p_id;
end $$;

-- Count a product view without race conditions.
create or replace function public.increment_product_views(p_id text)
returns void
language sql security definer set search_path = public as $$
  update public.products set views = views + 1 where id = p_id;
$$;

-- =====================================================================
-- Security: Row Level Security ON everywhere, no public policies.
-- Only the service_role key (used by the Fastop API server) can access data.
-- =====================================================================
alter table public.app_users          enable row level security;
alter table public.verification_codes enable row level security;
alter table public.shops              enable row level security;
alter table public.products           enable row level security;
alter table public.sales              enable row level security;
alter table public.expenses           enable row level security;
alter table public.enquiries          enable row level security;
alter table public.favorites          enable row level security;
alter table public.activity           enable row level security;
alter table public.settings           enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
grant execute on function public.record_sale(text, text, jsonb, text, text) to service_role;
grant execute on function public.void_sale(text, boolean) to service_role;
grant execute on function public.increment_product_views(text) to service_role;
