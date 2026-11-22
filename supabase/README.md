# Fastop database (Supabase)

All of Fastop's data lives in one Supabase (PostgreSQL) database: accounts, email codes, shops, products, sales, expenses, enquiries, saved products, the activity log and platform settings.

```
supabase/
  migrations/
    20261122000000_fastop_schema.sql   ← tables, indexes, functions, security
  README.md
```

Add new SQL files to `migrations/` with a newer timestamp in the name (`YYYYMMDDHHMMSS_what_it_does.sql`). Never edit a migration that has already been run on the live database; write a new one instead.

## Set up (one time)

1. Create a project at <https://supabase.com/dashboard>.
2. **SQL Editor → New query**: paste `migrations/20261122000000_fastop_schema.sql` and click **Run**.
3. **Project Settings → API**: copy the **Project URL** and the **service_role** secret key into `.env`:
   ```
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   (the service_role key, NOT the anon key)
   ```
4. Restart the API: `npm run api`. It prints `Database: Supabase` when it is connected. On the first start it copies any accounts from the old local file (`server/data/db.json`) into Supabase.

## Security

- Row Level Security is **on** for every table with **no public policies**, so the public `anon` key can't read or change anything.
- Only the Fastop API server uses the `service_role` key, and it checks who is allowed to do what. That key must **never** be put in the website code or shared.
- Only one admin (Control Centre) account can exist; the database enforces it with a unique index.
