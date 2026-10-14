# Lucas Racing website

The website, shop and admin panel for Lucas Racing × Hydro Karts: custom Arai SK-6 and Bell KC7 race helmets.

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, shadcn/ui and Supabase (Postgres, Auth, row level security).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   # Only needed to run migrations. Supabase > Connect > Session pooler URI.
   SUPABASE_DB_URL=postgresql://...
   ```

3. Create the database tables, security rules and starting data:

   ```bash
   npm run db:migrate
   ```

   This applies everything in `supabase/migrations` once, in order. It records applied files in `app_private.schema_migrations`.

4. In the Supabase dashboard, go to **Authentication > URL configuration**. Add `http://localhost:3000/auth/confirm` (and your live domain's equivalent) to the redirect URLs, so the links in confirmation emails work.

5. Start the site:

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000.

### Demo mode (no database)

Set `DEMO_MODE=true` in `.env.local` to run the whole UI on built-in sample data with Supabase switched off. A demo admin is always signed in, so you can review the account and admin pages. Saving, ordering and sign-in are disabled in this mode and say so. Set it to `false` once the database is set up.

### Admin access

Admins are the emails listed in the `admin_users` table. The seed migration adds `godesign.pk@gmail.com`. Sign up with that email, confirm it, and an **Admin dashboard** link appears in the account menu. Add more admins from **Admin > Settings > Admins**.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then `tsc` |
| `npm run db:migrate` | Apply pending SQL migrations |

## What's in it

**Public site:** home, helmet designs (search and filters), product pages, basket, checkout, about, contact.

**Design studio** (`/products/[slug]/customize`): a step-by-step builder (Helmet → Design → Materials → Details → Review) with a live preview, running price, shareable build links and a watermarked social image download.

**Customer account** (`/account`):
- overview,
- order history with status tracking,
- order details,
- profile and delivery address,
- password change.

**Admin panel** (`/admin`):

| Section | What admins can do |
| --- | --- |
| Dashboard | Revenue, orders, open orders, customers, recent orders |
| Orders | Search and filter orders; update order and payment status with notes, which customers see in their history; keep private notes |
| Customers | Search customers; see each customer's details, order history and total spend |
| Products | Edit names, copy, starting prices, available helmets, badges and features; show or hide designs |
| Films | Add, edit, price, hide or delete hydro-dip films |
| Pricing | New helmet prices and sizes; surcharges for finishes, colours, trims and the spoiler |
| Settings | Business and contact details, event banner, social links, delivery options and prices, admin access |

## How it works

- **Checkout and pricing.** Prices are always recalculated in the database by `public.place_order()`, so a tampered basket can't change what an order costs. `src/lib/pricing/helmet-price.ts` mirrors that logic so the configurator and basket can show prices.
- **Payment.** No payment gateway is connected yet. Orders are placed as *Received / Awaiting payment*, and the checkout tells customers a payment link follows their proof approval. A gateway can be added later without changing the order flow.
- **Caching.** The catalogue and settings are read with `use cache` and tagged (`src/lib/data/cache-tags.ts`). Admin saves call `updateTag()`, so the site updates straight away.
- **Security.** Every table has row level security. Customers can only read their own profile and orders. Only admins can change the catalogue, settings and orders. Every admin Server Action re-checks access on the server as well.
- **Sessions.** `src/proxy.ts` refreshes the Supabase session on each request. It sends signed-out visitors from `/account`, `/admin` and `/checkout` to the login page.

## Structure

```
supabase/migrations/   schema, RLS, place_order(), seed data
scripts/db-migrate.mjs migration runner
src/
  app/
    (public)/          public site, basket, checkout, account
    (auth)/            login and sign-up
    admin/             admin panel
    auth/confirm/      email confirmation handler
  components/
    ui/                shadcn/ui primitives (restyled)
    layout/ home/ products/ basket/ checkout/ account/ orders/ admin/ forms/ shared/ helmet/
  lib/
    actions/           Server Actions (auth, checkout, account, admin/*)
    data/              server data access (catalogue, settings, account, admin)
    supabase/          clients, proxy session refresh, types, row mappers
    basket/ configurator/ pricing/ orders/ validations/
  types/
```

## Still to do

- Connect a payment gateway (Stripe or similar).
- Deliver contact form messages (it currently only validates input).
- Swap in the client's logo, photos, real prices and policies.
- Build the 3D helmet builder to replace the illustrated preview.
