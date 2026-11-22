-- Shop owners are registered by the Control Centre and finish their own account on first sign-in.
--   username     chosen by the owner on first sign-in; can be used to sign in afterwards
--   phone        digits with country code (e.g. 256726128782); can be used to sign in
--   needs_setup  true from admin registration until the owner confirms their email and sets a password
--   onboarded    false until the owner has been through the welcome walkthrough
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.

alter table public.app_users add column if not exists username    text;
alter table public.app_users add column if not exists phone       text;
alter table public.app_users add column if not exists needs_setup boolean not null default false;
alter table public.app_users add column if not exists onboarded   boolean not null default true;

create unique index if not exists app_users_username_key on public.app_users (lower(username)) where username is not null;
create unique index if not exists app_users_phone_key    on public.app_users (phone)           where phone is not null;
