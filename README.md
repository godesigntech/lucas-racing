# Lucas Racing: interactive project demo

A working prototype of the Lucas Racing website:
- 3D helmet builder
- MS Kart parts shop with a proposed 2D customiser
- Future-phase kart sticker configurator
- Workshop admin and production area

It's built to show the agreed journeys and business rules to the client. **It is not a WordPress/WooCommerce installation.** The code is modular so real assets and integrations can replace the demo parts.

## Run it

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm test           # business-rule tests (Vitest)
npm run build      # static build in dist/ (HashRouter, relative base: works on any static host)
```

## Two scope modes

Use the switch in the dark bar under the header.
- **Launch experience:** the Kartmania scope. Arai SK6 and Bell KC7, five templates, website, parts shop. Stickers and merchandise show Coming Soon pages.
- **Full specification preview:** adds the ~6 model slots, 20 templates, blank drawing, artwork upload, simulated AI, and the kart sticker configurator.

The **Scope guide** page (`#/scope`) lists every feature as Launch, Future or Proposed. It also lists everything simulated and every client asset still needed.

## Storage: browser-local or Supabase

The app works immediately using **browser-local storage with simulated accounts**. To switch to the shared Supabase database with real accounts:
1. Open the Supabase dashboard for the project, then the SQL editor.
2. Run `supabase/migrations/0001_lucas_racing.sql`.
3. Put the project URL and anon/publishable key in `.env` (see `.env.example`), then restart `npm run dev`.

The app detects the `lr_records` table and switches over automatically. Workshop staff are granted by email in `public.lr_admins`; the migration seeds `godesign.pk@gmail.com`. Add the client's email there to give them admin access.

How the database protects data:
- RLS limits reads to the owner, staff and public settings.
- Writes go through the `lr_put`, `lr_get` and `lr_delete` RPCs, which enforce ownership rules.
- Paid orders and production history (`jobs`, `kartOrders`, `partOrders`) cannot be deleted.

## Code map

```
src/core/       types, colour, UV space, film renderer, helmet texture painter, kart panel renderer
src/data/       sample data: ~207 films, helmet models + 20 templates, kart bodywork + 20 templates, parts, default prices
src/domain/     pure business rules + tests (helmet pricing/approvals/jobs, kart proofs/print/reorders, parts fees, draft cleanup)
src/store/      backend adapters (local / Supabase), React hooks, basket, scope mode
src/three/      concept helmet geometry + Three.js viewer
src/ui/         shared UI kit
src/features/   helmet builder, kart stickers, shop + checkout, orders/admin/production
src/pages/      home, about, contact, merchandise, account, scope guide
legacy/         the earlier static Milestone 1 homepage
```

## Rules covered by tests (`src/domain/rules.test.ts`)

- Launch has 2 helmet models and 5 templates; the full collection has 20.
- Standard templates with stocked films get live itemised pricing, and admin price changes apply.
- A sponsor logo alone does not make a helmet bespoke. From-scratch, AI, uploaded designs, customer film imagery, special-order films and unconfirmed models all route to a quote.
- Standard checkout requires explicit approval of the exact version. Any edit invalidates the approval.
- The bespoke flow runs submit, revisions, quote, approval, payment. Earlier revisions are immutable.
- A locked master blocks edits until the workshop authorises a change. The old master and the payment history are preserved, and an additional invoice can be added.
- Unpaid designs are watermarked; the paid master is not.
- Kart custom, uploaded or AI artwork keeps automatic kit pricing. The design-service fee is paid upfront and only charged when requested.
- For kart orders, payment comes before proofing. Printing is blocked until the current proof is approved, the Sent to Print cutoff closes proof editing, and post-print changes are handled manually.
- Left and right pods can be reordered independently, by account customers only.
- Parts customisation pricing follows the admin decision (proposed feature).
- Draft cleanup never touches designs referenced by paid orders, jobs or shares.
