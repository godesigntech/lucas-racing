// Demo catalogue for testing the website: products in every shop, a few demo categories,
// and a gallery album built from Lucas Racing's own photos. Everything is clearly marked
// (slugs start with "demo-", part numbers with "DEMO-") and removed with "off".
//
// Usage: node --env-file=.env.local scripts/demo-products.mjs on    (add or refresh)
//        node --env-file=.env.local scripts/demo-products.mjs off   (remove it all)
import pg from "pg"

const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
await db.connect()

const NOTE = "Demo product for testing the website. Not for sale."
const DEMO_CATEGORY = "Demo category (remove before launch)."
const img = (name) => [`/images/demo/${name}.svg`]
const sizes = ["S", "M", "L", "XL", "XXL"]
const sizeGuide = (rows) => `| Size | Chest (in) | Length (in) |\n| --- | --- | --- |\n${rows}`

const products = [
  // MS Kart shop ------------------------------------------------------------------
  { store: "ms-kart", category: "complete-karts", slug: "demo-ok-n-complete-kart", title: "Demo OK-N complete kart", brand: "MS Kart", featured: true, images: img("kart"),
    specs: [["Class", "OK-N (demo)"], ["Wheelbase", "1040 mm (demo)"]], variants: [{ sku: "DEMO-KART-OKN", price: 3995, stock: 2 }] },
  { store: "ms-kart", category: "complete-karts", slug: "demo-junior-rolling-chassis", title: "Demo junior rolling chassis", brand: "MS Kart", featured: true, images: img("chassis"),
    specs: [["Class", "Junior (demo)"]], variants: [{ sku: "DEMO-CHASSIS-JR", price: 2895, stock: 1 }] },
  { store: "ms-kart", category: "steering", slug: "demo-steering-wheel", title: "Demo steering wheel 300 mm", brand: "MS Kart", images: img("steering-wheel"), optionNames: ["Colour"],
    variants: [{ sku: "DEMO-SW-BLK", option: { Colour: "Black" }, price: 89, stock: 6 }, { sku: "DEMO-SW-RED", option: { Colour: "Red" }, price: 94, stock: 2 }] },
  { store: "ms-kart", category: "brakes", slug: "demo-front-brake-disc", title: "Demo front brake disc", brand: "MS Kart", images: img("brake-disc"),
    variants: [{ sku: "DEMO-DISC-F", price: 64.5, stock: 3, compareAt: 72 }] },
  { store: "ms-kart", category: "engine-transmission", slug: "demo-rear-sprocket", title: "Demo rear sprocket", brand: "MS Kart", images: img("sprocket"), optionNames: ["Teeth"],
    variants: [{ sku: "DEMO-SPR-76", option: { Teeth: "76" }, price: 18, stock: 10 }, { sku: "DEMO-SPR-78", option: { Teeth: "78" }, price: 18, stock: 1 }, { sku: "DEMO-SPR-80", option: { Teeth: "80" }, price: 18, stock: 0 }] },
  { store: "ms-kart", category: "seats", slug: "demo-kart-seat", title: "Demo kart seat", brand: "MS Kart", images: img("seat"), optionNames: ["Size"],
    variants: ["S", "M", "L"].map((size, index) => ({ sku: `DEMO-SEAT-${size}`, option: { Size: size }, price: 79, stock: [4, 5, 2][index] })) },
  { store: "ms-kart", category: "engine-transmission", slug: "demo-chain-219", title: "Demo chain 219 (sold out)", brand: "MS Kart", images: img("chain"),
    variants: [{ sku: "DEMO-CHAIN-219", price: 24.99, stock: 0 }] },
  { store: "ms-kart", category: "bodywork", slug: "demo-nose-cone", title: "Demo nose cone (made to order)", brand: "MS Kart", images: img("nose-cone"),
    variants: [{ sku: "DEMO-NOSE", price: 79, stock: 0, backorder: true }] },
  { store: "ms-kart", category: "wheels-tyres", slug: "demo-tyre-set", title: "Demo tyre set", brand: "MS Kart", images: img("tyres"),
    variants: [{ sku: "DEMO-TYRES", price: 195, stock: 0, track: false }] },

  // Wendy's Teamwear ---------------------------------------------------------------
  { store: "teamwear", category: "hoodies-sweatshirts", slug: "demo-team-hoodie", title: "Demo Lucas Racing hoodie", brand: "Lucas Racing", featured: true, images: img("hoodie"), optionNames: ["Size", "Colour"],
    sizeGuide: sizeGuide("| S | 38 | 27 |\n| M | 41 | 28 |\n| L | 44 | 29 |\n| XL | 47 | 30 |\n| XXL | 50 | 31 |"),
    variants: ["Black", "Grey"].flatMap((colour) => sizes.map((size) => ({ sku: `DEMO-HOOD-${colour[0]}-${size}`, option: { Size: size, Colour: colour }, price: size === "XXL" ? 38 : 35, stock: colour === "Grey" && size === "S" ? 0 : 6 }))) },
  { store: "teamwear", category: "t-shirts-polos", slug: "demo-team-t-shirt", title: "Demo team T-shirt", brand: "Lucas Racing", images: img("tshirt"), optionNames: ["Size"],
    sizeGuide: sizeGuide("| S | 36 | 27 |\n| M | 39 | 28 |\n| L | 42 | 29 |\n| XL | 45 | 30 |\n| XXL | 48 | 31 |"),
    variants: sizes.map((size) => ({ sku: `DEMO-TEE-${size}`, option: { Size: size }, price: 18, stock: 8 })) },
  { store: "teamwear", category: "t-shirts-polos", slug: "demo-team-polo", title: "Demo team polo shirt", brand: "Lucas Racing", images: img("polo"), optionNames: ["Size"],
    variants: sizes.map((size) => ({ sku: `DEMO-POLO-${size}`, option: { Size: size }, price: 24, stock: size === "XXL" ? 2 : 5 })) },
  { store: "teamwear", category: "caps-accessories", slug: "demo-team-cap", title: "Demo team cap", brand: "Lucas Racing", images: img("cap"),
    variants: [{ sku: "DEMO-CAP", price: 15, stock: 12 }] },

  // MS Kart parts by HydroKarts (customisable) --------------------------------------------
  { store: "hydrokarts-parts", slug: "demo-front-fairing", title: "Demo front fairing", brand: "MS Kart", images: img("fairing"), customisable: true, finishes: ["paint", "film", "chrome"], fee: 40,
    variants: [{ sku: "DEMO-HK-FAIRING", price: 60, stock: 5 }] },
  { store: "hydrokarts-parts", slug: "demo-side-pods", title: "Demo side pods (pair)", brand: "MS Kart", images: img("side-pods"), customisable: true, finishes: ["paint", "film"], fee: 55,
    variants: [{ sku: "DEMO-HK-PODS", price: 120, stock: 3 }] },
  { store: "hydrokarts-parts", slug: "demo-steering-wheel-cover", title: "Demo steering wheel cover", brand: "MS Kart", images: img("wheel-cover"), customisable: true, finishes: ["film"], fee: 20,
    variants: [{ sku: "DEMO-HK-WHEEL", price: 30, stock: 8 }] },

  // Delta Racewear (browse only; the link is a placeholder until Delta's real URLs arrive) --------
  { store: "delta", category: "race-suits", slug: "demo-delta-race-suit", title: "Demo kart race suit", brand: "Delta Racewear", featured: true, images: img("race-suit"), externalUrl: "https://example.com/delta-demo/race-suit",
    variants: [{ sku: "DEMO-DELTA-SUIT", price: 450, track: false }] },
  { store: "delta", category: "race-suits", slug: "demo-delta-junior-suit", title: "Demo junior race suit", brand: "Delta Racewear", images: img("race-suit"), externalUrl: "https://example.com/delta-demo/junior-suit",
    variants: [{ sku: "DEMO-DELTA-JUNIOR", price: 350, track: false }] },
  { store: "delta", category: "gloves", slug: "demo-delta-gloves", title: "Demo race gloves", brand: "Delta Racewear", images: img("gloves"), externalUrl: "https://example.com/delta-demo/gloves",
    variants: [{ sku: "DEMO-DELTA-GLOVES", price: 55, track: false }] },
  { store: "delta", category: "accessories", slug: "demo-delta-boots", title: "Demo kart boots", brand: "Delta Racewear", images: img("boots"), externalUrl: "https://example.com/delta-demo/boots",
    variants: [{ sku: "DEMO-DELTA-BOOTS", price: 85, track: false }] },
]

// Subcategories of MS Kart "Parts and spares" used by the demo parts.
const demoCategories = [
  ["steering", "Steering", 10],
  ["brakes", "Brakes", 20],
  ["engine-transmission", "Engine and transmission", 30],
  ["bodywork", "Bodywork", 40],
  ["seats", "Seats", 50],
  ["wheels-tyres", "Wheels and tyres", 60],
]

const galleryPhotos = [
  ["/images/team/team-photo.webp", "The Lucas Racing team and drivers together in the paddock", 2000, 1333],
  ["/images/team/team-awning.webp", "The Lucas Racing and MS Kart awning lit up at a race meeting", 1170, 677],
  ["/images/team/father-and-son-paddock.webp", "A driver in an MS Kart and Lucas Racing suit with Howard Lucas", 2000, 1342],
  ["/images/team/howard.webp", "Howard Lucas shaking hands with a driver in the paddock", 1440, 960],
  ["/images/team/connor.webp", "Connor Lucas checking tyre pressures on an MS Kart", 2000, 1338],
  ["/images/team/connor-coaching.webp", "Connor Lucas coaching a young driver", 1364, 909],
  ["/images/team/wendy.webp", "Wendy Lucas at the team hospitality table", 1205, 872],
  ["/images/team/father-and-son.webp", "A Lucas Racing driver and Howard Lucas sharing a laugh", 960, 640],
]

async function removeDemo() {
  const products = await db.query("delete from public.shop_products where slug like 'demo-%'")
  const categories = await db.query("delete from public.shop_categories where description = $1", [DEMO_CATEGORY])
  const albums = await db.query("delete from public.gallery_albums where slug like 'demo-%'")
  return { products: products.rowCount, categories: categories.rowCount, albums: albums.rowCount }
}

if (process.argv[2] === "off") {
  console.log("Removed", await removeDemo())
} else if (process.argv[2] === "on") {
  await db.query("begin")
  try {
    await removeDemo()
    const parts = (await db.query("select id from public.shop_categories where store_id = 'ms-kart' and slug = 'parts'")).rows[0]
    for (const [slug, name, order] of demoCategories) {
      await db.query(
        "insert into public.shop_categories (store_id, parent_id, name, slug, description, sort_order) values ('ms-kart', $1, $2, $3, $4, $5) on conflict (store_id, slug) do nothing",
        [parts?.id ?? null, name, slug, DEMO_CATEGORY, order],
      )
    }
    const categoryId = async (store, slug) => (slug ? (await db.query("select id from public.shop_categories where store_id = $1 and slug = $2", [store, slug])).rows[0]?.id ?? null : null)

    for (const [position, product] of products.entries()) {
      const { rows: [row] } = await db.query(
        `insert into public.shop_products
           (store_id, category_id, slug, title, brand, description, specs, images, option_names, external_url, is_active, featured,
            customisable, custom_finishes, custom_fee, size_guide, sort_order)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, $14, $15, $16) returning id`,
        [
          product.store,
          await categoryId(product.store, product.category),
          product.slug,
          product.title,
          product.brand ?? "",
          `${NOTE}\n\nUse this to try the product page, options, stock and checkout.`,
          JSON.stringify((product.specs ?? []).map(([label, value]) => ({ label, value }))),
          product.images,
          product.optionNames ?? [],
          product.externalUrl ?? null,
          product.featured ?? false,
          product.customisable ?? false,
          product.finishes ?? [],
          product.fee ?? 0,
          product.sizeGuide ?? "",
          (position + 1) * 10,
        ],
      )
      for (const [index, variant] of product.variants.entries()) {
        await db.query(
          `insert into public.shop_variants (product_id, sku, option_values, price, compare_at_price, stock_quantity, track_stock, allow_backorder, sort_order)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [row.id, variant.sku, JSON.stringify(variant.option ?? {}), variant.price, variant.compareAt ?? null, variant.stock ?? 0, variant.track ?? true, variant.backorder ?? false, (index + 1) * 10],
        )
      }
    }

    const { rows: [album] } = await db.query(
      `insert into public.gallery_albums (slug, title, event, album_date, description, is_published, cover_url)
       values ('demo-paddock-life', 'Demo album: life in the paddock', 'Race weekend', current_date, $1, true, $2) returning id`,
      ["Demo album built from Lucas Racing's own photos to test the gallery. Rename or delete it before launch.", galleryPhotos[0][0]],
    )
    for (const [index, [url, caption, width, height]] of galleryPhotos.entries()) {
      await db.query("insert into public.gallery_photos (album_id, image_url, caption, width, height, sort_order) values ($1, $2, $3, $4, $5, $6)", [album.id, url, caption, width, height, (index + 1) * 10])
    }
    await db.query("commit")
    console.log(`Added ${products.length} demo products, ${demoCategories.length} demo categories and a demo gallery album.`)
  } catch (error) {
    await db.query("rollback")
    throw error
  }
} else {
  console.log("Usage: node --env-file=.env.local scripts/demo-products.mjs on|off")
}
await db.end()
