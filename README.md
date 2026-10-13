# Lucas Racing — Website

Phase One build for **lucasracing.co.uk**: website, helmet builder (Arai SK6 / Bell KC7) and MS Kart parts shop, launching at **Kartmania, 14–15 Nov 2026**.

## Milestone 1: Website design, homepage and structure

This repo currently holds the homepage design and the shared design system (header, footer, typography, colours and components). Every inner page reuses them.

```
index.html              Homepage
assets/css/styles.css   Design system and homepage styles
assets/js/helmet.js     2D helmet renderer (templates, films, chrome, trims)
assets/js/main.js       Homepage interactions
```

Run it locally:

```bash
python -m http.server 5510
```

Then open http://localhost:5510.

Links to pages that aren't built yet show a short note saying which milestone delivers them.

## Site structure

| Section | URL | Milestone |
|---|---|---|
| Home | `/` | 1 |
| About / Team (Lucas Racing + Hydro Karts) | `/about/` | 2 |
| Services (race-day, test days, awning, maintenance, transport) | `/services/` | 2 |
| Events / What's On (Kartmania) | `/events/` | 2 |
| Partners | `/partners/` | 2 |
| Contact | `/contact/` | 2 |
| Competition (rules, social voting) | `/competition/` | 2 |
| Hydro Dip / Film library | `/hydro-dip/` | 2 (Coming Soon for parts) |
| Kart Stickers | `/kart-stickers/` | 2 (Coming Soon) |
| Merchandise and Delta Racewear | `/merchandise/`, `/racewear/` | 2 (Coming Soon) |
| Legal: FAQ, Delivery, Terms, Privacy | `/faq/`, `/delivery/`, `/terms/`, `/privacy/` | 2 |
| Helmet Builder (SK6/KC7, templates, films, chrome, names/numbers/logos, trims, spoiler) | `/helmet-builder/` | 3 |
| Send your own helmet | `/send-your-helmet/` | 3 |
| Account: saved designs, share links | `/account/` | 3 |
| Shop: Racing Karts, Frame Components, Trolleys, Spares | `/shop/...` | 4 |
| Basket and checkout | `/basket/` | 4 |

## Notes

- Shop products on the homepage are placeholders until the MS Kart (ABRA) product feed is connected.
- The team photo, logo files and social links are placeholders until the client supplies them.
- The homepage helmet is a 2D teaser. The full builder uses 360° 3D models.
