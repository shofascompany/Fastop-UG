# Fastop

**Every kind of shop, one place to find what they stock.**

Fastop is a Vue 3 app with one platform and three connected interfaces:

| Interface | Route | Who | What it does |
|---|---|---|---|
| **Control Panel** | `/admin` | Administrator | Manages users, shops (approve / suspend / delete), product listings, activity log and platform settings. Can open any shop's manager or the customer view. |
| **Shop Manager** | `/shop` | Shop owners (and admin) | Business management: dashboard, point of sale with receipts, inventory with low-stock alerts, sales history, expenses and profit, customer enquiries, and shop profile with a map location picker. |
| **Customer Showcase** | `/explore` | Customers (admin and shops can preview) | Price-free advertising: browse and search products, shop pages, an interactive **map** with "near me", distances and directions, saved products, and enquiries to shops. |

Public pages: landing (`/`), about and FAQ (`/about`), and a combined **sign in / sign up** page (`/auth`).

## Login: one form for everything

The `/auth` page asks only for **email + password**:

1. **Existing, confirmed account:** you're signed in and sent to your interface (customer → `/explore`, shop owner → `/shop`, Control Centre → `/admin`).
2. **New email:** the account is created automatically (tick *I'm a shop owner* to tag it as a shop) and you go to **`/verify`**. The server emails a **6-digit code** to that address. It **expires in 15 minutes**, allows 5 tries, and can be re-sent after 60 seconds. The code is never sent to the browser.
3. **Existing but unconfirmed account:** a code is sent again and you go to `/verify`.

The **Control Centre** has exactly one account, set in `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). It signs in through the same form. Nobody else can ever get the admin role, and the admin can't be edited or deleted from the app.

Passwords are hashed (scrypt), codes are stored only as keyed hashes, sessions are signed tokens (7 days), and sign-in attempts are rate-limited.

## Getting started

```bash
npm install
cp .env.example .env   # then fill it in (see below)
npm run api            # Fastop API on http://localhost:8787 (accounts, email, data; restarts on code changes)
npm run db:check       # checks the Supabase connection, key type, tables and functions
npm run dev            # website on http://localhost:5173 (proxies /api to the API)
```

Production: `npm run build`, then `npm start` serves both the API and the built site from one Node process.

### Sending the verification emails (Gmail)

Fill these in `.env` and restart `npm run api`:

```
SMTP_USER=youraddress@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx     # a Google App password, NOT your normal password
MAIL_FROM=Fastop <youraddress@gmail.com>
```

Create the App password at Google Account → Security → 2-Step Verification → **App passwords** (2-Step Verification must be on). Until these are set, the API prints each code in its own terminal window so you can still test. The code never appears in the website.

## Tech

- **Vue 3** (`<script setup>`), **Vue Router 4** (every page is its own route and file, lazy-loaded)
- **Pinia** for state
- **Leaflet** + **OpenStreetMap** tiles for the map (no API key needed)
- Hand-made design system (`src/assets/main.css`), SVG logo (`src/components/AppLogo.vue`, `public/favicon.svg`) and icon set (`src/components/AppIcon.vue`)

## Project structure

```
src/
  assets/main.css            design system
  components/                logo, icons, shell, map, cards, modal, toasts, charts
  composables/               useCurrentShop, useGeo (location + distance)
  data/                      categories, empty initial state (seed.js)
  layouts/                   AdminLayout, ShopLayout, CustomerLayout
  router/index.js            routes + role guards
  stores/                    db (local database), auth, toast
  views/
    LandingPage.vue  AboutPage.vue  AuthPage.vue  NotFound.vue
    admin/     AdminDashboard  AdminUsers  AdminShops  AdminProducts  AdminActivity  AdminSettings
    shop/      ShopDashboard  ShopPOS  ShopProducts  ShopSales  ShopExpenses  ShopEnquiries  ShopProfile
    customer/  ExploreHome  ExploreProducts  ProductDetail  ExploreShops  ShopDetail  ExploreMap  SavedProducts  MyEnquiries
```

## Data and production notes

- **Everything is stored in Supabase** (PostgreSQL): accounts, email codes, shops, products, sales, expenses, enquiries, saved products, activity and settings. The schema is in [`supabase/migrations/`](supabase/migrations/); setup steps are in [`supabase/README.md`](supabase/README.md).
- The browser never talks to Supabase directly. It calls the Fastop API (`/api/data`, `/api/data/<action>`), which checks permissions and uses the secret `service_role` key. Guests and customers never receive prices or cost prices.
- Until `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the API falls back to a local file (`server/data/db.json`) so you can keep developing. On the first start with Supabase, existing accounts from that file are copied over.
- Each device keeps a cached copy of the last data for an instant start; it is refreshed from the server on every visit.
- Keep `.env` private. It holds the Control Centre password, the signing secret, the Gmail app password and the Supabase service key.

Defaults: currency **UGX**, map centred on **Kampala**. Change both in **Control Panel → Settings**. Each shop sets its exact pin in **Shop profile**. Set a support email in Settings to show the "Contact support" links.
