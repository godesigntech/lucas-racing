# Lucas Racing website

The public website for Lucas Racing × Hydro Karts: custom Arai SK-6 and Bell KC7 race helmets. Built with Next.js (App Router), TypeScript, Tailwind CSS and shadcn/ui.

This is the website foundation (Phase 1). It runs on static sample data, and its form and account flows are previews. The 3D helmet builder, Supabase data and real authentication come next.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck  # generates Next route types, then runs tsc
npm run build
npm start          # serve the production build
```

Requires Node.js 20 or later.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Homepage: hero, featured designs, benefits, why us, process, styles, sample reviews, CTA |
| `/products` | Helmet designs with search, a style filter and a helmet filter (`?category=` and `?helmet=` are shareable) |
| `/products/[slug]` | Design detail: gallery, specs, related designs and the configurator |
| `/about` | Story, mission and values, team placeholders |
| `/contact` | Contact details and the enquiry form (pre-filled from `?design=` and `?build=`) |
| `/login`, `/signup` | Account forms (preview only) |
| `/privacy`, `/terms` | Placeholder policy pages |

## Structure

```
src/
  app/
    (public)/          pages that share the header and footer
    (auth)/            login and sign-up, with their own split layout
    layout.tsx         fonts, metadata, toast provider
    not-found.tsx
  components/
    ui/                shadcn/ui primitives, restyled to the brand
    layout/            header, footer, mobile nav, container, wordmark
    helmet/            SVG helmet illustration and hydro-dip film patterns
    home/ about/ contact/ products/ forms/ shared/
  config/site.ts       business details (placeholders marked)
  constants/           navigation, image sources
  data/                static sample data (products, categories, options, copy)
  lib/
    data/products.ts   data-access functions (swap these for Supabase/API calls)
    configurator/      pure configurator logic (options, defaults, summary)
    products/          filter logic
    services/          mock services for forms and accounts
    validations/       Zod schemas
  hooks/               useHelmetConfigurator
  types/
```

## Design system

Tokens live in `src/app/globals.css`: carbon and paper neutrals, a single lime accent, Barlow Condensed for display type, Geist for body text and Geist Mono for labels. The shadcn components in `src/components/ui` use these tokens.

## What's simulated

- **Products, prices and testimonials** are sample content in `src/data`. Prices are marked as sample pricing on the site.
- **Contact, login and sign-up** validate input with Zod and show toasts, but nothing is sent or stored. The mock functions live in `src/lib/services` and are labelled as previews in the UI.
- **Helmet visuals** are SVG illustrations (`src/components/helmet`), not the final 3D models.
- **Contact details and social links** in `src/config/site.ts` are placeholders.
- **Photos** come from Unsplash (free licence) via `src/constants/images.ts`.

## Next steps

1. Connect Supabase: replace `src/lib/data/*` and `src/lib/services/*` with real queries, auth and Server Actions.
2. Build the 3D helmet builder (three.js) and replace the illustrated preview on the product page.
3. Swap in the client's logo, photos, copy, prices and policies.
