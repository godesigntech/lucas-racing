// Placeholder catalogue so the website can be tried before the real product data arrives:
// products in every shop, a few MS Kart categories and a gallery album built from Lucas
// Racing's own photos. Nothing on the site says it's placeholder content; each product is
// tagged with a hidden marker (external_id "seed-…") so "off" removes exactly what "on" added.
// Remove it before launch.
//
// Usage: node --env-file=.env.local scripts/catalogue-seed.mjs on    (add or refresh)
//        node --env-file=.env.local scripts/catalogue-seed.mjs off   (remove it all)
import pg from "pg"

const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
await db.connect()

const MARKER = "seed-"
const img = (name) => [`/images/catalogue/${name}.svg`]
const sizes = ["S", "M", "L", "XL", "XXL"]
const sizeGuide = (rows) => `| Size | Chest (in) | Length (in) |\n| --- | --- | --- |\n${rows}`

const products = [
  // MS Kart shop ------------------------------------------------------------------------
  {
    store: "ms-kart", category: "complete-karts", slug: "ok-n-complete-kart", title: "OK-N complete kart", brand: "MS Kart", featured: true, images: img("kart"),
    description: "A race-ready complete kart for the OK-N class, built on an MS Kart chassis and set up by the team before you collect it.\n\nIncludes seat fitting and a baseline setup sheet for your first test day. Ask us about engine packages and spares bundles.",
    specs: [["Class", "OK-N"], ["Chassis", "30 mm frame"], ["Brakes", "Hydraulic rear"], ["Supplied", "Seat fitted, setup sheet"]],
    variants: [{ sku: "MSK-OKN-001", price: 3995, stock: 2 }],
  },
  {
    store: "ms-kart", category: "complete-karts", slug: "junior-rolling-chassis", title: "Junior rolling chassis", brand: "MS Kart", featured: true, images: img("chassis"),
    description: "A rolling chassis for junior drivers moving up a class, supplied ready for your engine.\n\nWe'll set the seat position and pedals for the driver and talk you through the setup.",
    specs: [["Class", "Junior"], ["Frame", "28 mm"], ["Supplied", "Without engine"]],
    variants: [{ sku: "MSK-JR-CH-01", price: 2895, stock: 1 }],
  },
  {
    store: "ms-kart", category: "steering", slug: "steering-wheel-300", title: "Steering wheel 300 mm", brand: "MS Kart", images: img("steering-wheel"), optionNames: ["Colour"],
    description: "A 300 mm steering wheel with a grippy suede rim and a six-bolt boss, to suit MS Kart steering columns.",
    specs: [["Diameter", "300 mm"], ["Fixing", "Six-bolt boss"]],
    variants: [{ sku: "MSK-SW-300-BLK", option: { Colour: "Black" }, price: 89, stock: 6 }, { sku: "MSK-SW-300-RED", option: { Colour: "Red" }, price: 94, stock: 2 }],
  },
  {
    store: "ms-kart", category: "brakes", slug: "front-brake-disc", title: "Front brake disc", brand: "MS Kart", images: img("brake-disc"),
    description: "A replacement front brake disc for MS Kart front brake systems. Supplied as a single disc.",
    specs: [["Position", "Front"], ["Supplied", "Single disc"]],
    variants: [{ sku: "MSK-BD-F-01", price: 64.5, stock: 3, compareAt: 72 }],
  },
  {
    store: "ms-kart", category: "engine-transmission", slug: "rear-sprocket", title: "Rear sprocket", brand: "MS Kart", images: img("sprocket"), optionNames: ["Teeth"],
    description: "A 219 pitch rear sprocket in a choice of sizes to tune your gearing for the circuit.",
    specs: [["Chain pitch", "219"], ["Material", "Aluminium"]],
    variants: [{ sku: "MSK-SPR-76", option: { Teeth: "76" }, price: 18, stock: 10 }, { sku: "MSK-SPR-78", option: { Teeth: "78" }, price: 18, stock: 1 }, { sku: "MSK-SPR-80", option: { Teeth: "80" }, price: 18, stock: 0 }],
  },
  {
    store: "ms-kart", category: "seats", slug: "kart-seat", title: "Kart seat", brand: "MS Kart", images: img("seat"), optionNames: ["Size"],
    description: "A fibreglass kart seat in three sizes. We're happy to help with fitting and seat position.",
    specs: [["Material", "Fibreglass"]],
    variants: ["S", "M", "L"].map((size, index) => ({ sku: `MSK-SEAT-${size}`, option: { Size: size }, price: 79, stock: [4, 5, 2][index] })),
  },
  {
    store: "ms-kart", category: "engine-transmission", slug: "chain-219", title: "Chain 219", brand: "MS Kart", images: img("chain"),
    description: "A 219 pitch kart chain, 106 links. Cut to length to suit your gearing.",
    specs: [["Pitch", "219"], ["Links", "106"]],
    variants: [{ sku: "MSK-CH-219", price: 24.99, stock: 0 }],
  },
  {
    store: "ms-kart", category: "bodywork", slug: "nose-cone", title: "Nose cone", brand: "MS Kart", images: img("nose-cone"),
    description: "A front nose cone with mounting kit. Made to order: we'll confirm the delivery date when you order.",
    specs: [["Supplied", "With mounting kit"]],
    variants: [{ sku: "MSK-NOSE-01", price: 79, stock: 0, backorder: true }],
  },
  {
    store: "ms-kart", category: "wheels-tyres", slug: "slick-tyre-set", title: "Slick tyre set", brand: "MS Kart", images: img("tyres"),
    description: "A set of four slick tyres (two front, two rear). Ask us which compound suits your class and championship.",
    specs: [["Supplied", "2 front, 2 rear"]],
    variants: [{ sku: "MSK-TYRE-SET", price: 195, stock: 0, track: false }],
  },

  // Wendy's Teamwear -----------------------------------------------------------------------
  {
    store: "teamwear", category: "hoodies-sweatshirts", slug: "lucas-racing-hoodie", title: "Lucas Racing hoodie", brand: "Lucas Racing", featured: true, images: img("hoodie"), optionNames: ["Size", "Colour"],
    description: "A warm, heavyweight team hoodie with the Lucas Racing logo on the chest. Perfect for cold mornings in the paddock.\n\nMachine wash at 30°C, inside out.",
    specs: [["Fabric", "80% cotton, 20% polyester"], ["Fit", "Regular"]],
    sizeGuide: sizeGuide("| S | 38 | 27 |\n| M | 41 | 28 |\n| L | 44 | 29 |\n| XL | 47 | 30 |\n| XXL | 50 | 31 |"),
    variants: ["Black", "Grey"].flatMap((colour) => sizes.map((size) => ({ sku: `LR-HOOD-${colour[0]}-${size}`, option: { Size: size, Colour: colour }, price: size === "XXL" ? 38 : 35, stock: colour === "Grey" && size === "S" ? 0 : 6 }))),
  },
  {
    store: "teamwear", category: "t-shirts-polos", slug: "lucas-racing-t-shirt", title: "Lucas Racing T-shirt", brand: "Lucas Racing", images: img("tshirt"), optionNames: ["Size"],
    description: "A soft cotton team T-shirt with the Lucas Racing logo. Wear it at the track or anywhere else.",
    specs: [["Fabric", "100% cotton"], ["Fit", "Regular"]],
    sizeGuide: sizeGuide("| S | 36 | 27 |\n| M | 39 | 28 |\n| L | 42 | 29 |\n| XL | 45 | 30 |\n| XXL | 48 | 31 |"),
    variants: sizes.map((size) => ({ sku: `LR-TEE-${size}`, option: { Size: size }, price: 18, stock: 8 })),
  },
  {
    store: "teamwear", category: "t-shirts-polos", slug: "lucas-racing-polo-shirt", title: "Lucas Racing polo shirt", brand: "Lucas Racing", images: img("polo"), optionNames: ["Size"],
    description: "A smart team polo shirt with an embroidered Lucas Racing logo, ideal for race days and events.",
    specs: [["Fabric", "Cotton piqué"], ["Logo", "Embroidered"]],
    variants: sizes.map((size) => ({ sku: `LR-POLO-${size}`, option: { Size: size }, price: 24, stock: size === "XXL" ? 2 : 5 })),
  },
  {
    store: "teamwear", category: "caps-accessories", slug: "lucas-racing-cap", title: "Lucas Racing cap", brand: "Lucas Racing", images: img("cap"),
    description: "A team cap with the Lucas Racing logo and an adjustable strap. One size fits most.",
    specs: [["Size", "One size, adjustable"]],
    variants: [{ sku: "LR-CAP-01", price: 15, stock: 12 }],
  },

  // MS Kart parts by HydroKarts (customisable) ------------------------------------------------
  {
    store: "hydrokarts-parts", slug: "front-fairing", title: "Front fairing", brand: "MS Kart", images: img("fairing"), customisable: true, finishes: ["paint", "film", "chrome"], fee: 40,
    description: "An MS Kart front fairing finished by HydroKarts in your choice of paint, hydro-dip film or chrome, to match your helmet.",
    variants: [{ sku: "HK-FAIRING-01", price: 60, stock: 5 }],
  },
  {
    store: "hydrokarts-parts", slug: "side-pods", title: "Side pods (pair)", brand: "MS Kart", images: img("side-pods"), customisable: true, finishes: ["paint", "film"], fee: 55,
    description: "A pair of MS Kart side pods finished in your colours or a hydro-dip film from our library.",
    variants: [{ sku: "HK-PODS-01", price: 120, stock: 3 }],
  },
  {
    store: "hydrokarts-parts", slug: "steering-wheel-cover", title: "Steering wheel cover", brand: "MS Kart", images: img("wheel-cover"), customisable: true, finishes: ["film"], fee: 20,
    description: "A steering wheel centre cover hydro-dipped in any film from our library.",
    variants: [{ sku: "HK-WHEEL-01", price: 30, stock: 8 }],
  },

  // Delta Racewear (browse only; links go to the reserved example.com until Delta's real pages arrive) --
  {
    store: "delta", category: "race-suits", slug: "delta-kart-race-suit", title: "Kart race suit", brand: "Delta Racewear", featured: true, images: img("race-suit"), externalUrl: "https://example.com/delta-racewear/kart-race-suit",
    description: "A custom kart race suit from Delta Racewear, designed in your colours and made to order by Delta.\n\nChoose your design and size on Delta's website.",
    specs: [["Made by", "Delta Racewear"], ["Design", "Custom, your colours"]],
    variants: [{ sku: "DELTA-SUIT-01", price: 450, track: false }],
  },
  {
    store: "delta", category: "race-suits", slug: "delta-junior-race-suit", title: "Junior race suit", brand: "Delta Racewear", images: img("race-suit"), externalUrl: "https://example.com/delta-racewear/junior-race-suit",
    description: "A custom race suit for junior drivers, made to order by Delta Racewear in the colours you choose.",
    specs: [["Made by", "Delta Racewear"], ["Sizes", "Junior"]],
    variants: [{ sku: "DELTA-JR-SUIT-01", price: 350, track: false }],
  },
  {
    store: "delta", category: "gloves", slug: "delta-race-gloves", title: "Race gloves", brand: "Delta Racewear", images: img("gloves"), externalUrl: "https://example.com/delta-racewear/race-gloves",
    description: "Lightweight race gloves from Delta Racewear, available to match your suit.",
    specs: [["Made by", "Delta Racewear"]],
    variants: [{ sku: "DELTA-GLOVES-01", price: 55, track: false }],
  },
  {
    store: "delta", category: "accessories", slug: "delta-kart-boots", title: "Kart boots", brand: "Delta Racewear", images: img("boots"), externalUrl: "https://example.com/delta-racewear/kart-boots",
    description: "Kart boots from Delta Racewear with a thin sole for feel on the pedals.",
    specs: [["Made by", "Delta Racewear"]],
    variants: [{ sku: "DELTA-BOOTS-01", price: 85, track: false }],
  },
]

// Subcategories of MS Kart "Parts and spares" used by the placeholder parts.
const categories = [
  ["steering", "Steering", "Steering wheels, columns and steering parts.", 10],
  ["brakes", "Brakes", "Brake discs, pads and brake system parts.", 20],
  ["engine-transmission", "Engine and transmission", "Sprockets, chains and transmission parts.", 30],
  ["bodywork", "Bodywork", "Nose cones, fairings, side pods and fixings.", 40],
  ["seats", "Seats", "Kart seats and seat fixings.", 50],
  ["wheels-tyres", "Wheels and tyres", "Wheels, rims and tyres.", 60],
]

const ALBUM_SLUG = "life-in-the-paddock"
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

async function removeAll({ keepCategories = false } = {}) {
  // Also clears the older "demo-" version of this catalogue.
  const removedProducts = await db.query("delete from public.shop_products where external_id like $1 or slug like 'demo-%'", [`${MARKER}%`])
  if (keepCategories) {
    const removedAlbums = await db.query("delete from public.gallery_albums where slug = any($1)", [[ALBUM_SLUG, "demo-paddock-life"]])
    return { products: removedProducts.rowCount, categories: 0, albums: removedAlbums.rowCount }
  }
  const parts = (await db.query("select id from public.shop_categories where store_id = 'ms-kart' and slug = 'parts'")).rows[0]
  // Only the categories this script added, and only while nothing else is in them.
  const removedCategories = await db.query(
    `delete from public.shop_categories c
     where c.store_id = 'ms-kart' and c.slug = any($1) and c.parent_id is not distinct from $2
       and not exists (select 1 from public.shop_products p where p.category_id = c.id)`,
    [categories.map(([slug]) => slug), parts?.id ?? null],
  )
  const removedAlbums = await db.query("delete from public.gallery_albums where slug = any($1)", [[ALBUM_SLUG, "demo-paddock-life"]])
  return { products: removedProducts.rowCount, categories: removedCategories.rowCount, albums: removedAlbums.rowCount }
}

if (process.argv[2] === "off") {
  console.log("Removed", await removeAll())
} else if (process.argv[2] === "on") {
  await db.query("begin")
  try {
    // Categories are kept (same ids), so the site's cached category list stays valid.
    await removeAll({ keepCategories: true })
    const parts = (await db.query("select id from public.shop_categories where store_id = 'ms-kart' and slug = 'parts'")).rows[0]
    for (const [slug, name, description, order] of categories) {
      await db.query(
        "insert into public.shop_categories (store_id, parent_id, name, slug, description, sort_order) values ('ms-kart', $1, $2, $3, $4, $5) on conflict (store_id, slug) do update set name = excluded.name, description = excluded.description",
        [parts?.id ?? null, name, slug, description, order],
      )
    }
    const categoryId = async (store, slug) => (slug ? (await db.query("select id from public.shop_categories where store_id = $1 and slug = $2", [store, slug])).rows[0]?.id ?? null : null)

    for (const [position, product] of products.entries()) {
      const { rows: [row] } = await db.query(
        `insert into public.shop_products
           (store_id, category_id, slug, title, brand, description, specs, images, option_names, external_url, external_id, is_active, featured,
            customisable, custom_finishes, custom_fee, size_guide, sort_order)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, $13, $14, $15, $16, $17) returning id`,
        [
          product.store,
          await categoryId(product.store, product.category),
          product.slug,
          product.title,
          product.brand ?? "",
          product.description,
          JSON.stringify((product.specs ?? []).map(([label, value]) => ({ label, value }))),
          product.images,
          product.optionNames ?? [],
          product.externalUrl ?? null,
          `${MARKER}${product.slug}`,
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
       values ($1, 'Life in the paddock', 'Race weekend', current_date, $2, true, $3) returning id`,
      [ALBUM_SLUG, "The team, the drivers and the people who make Lucas Racing what it is, at the circuit and away from it.", galleryPhotos[0][0]],
    )
    for (const [index, [url, caption, width, height]] of galleryPhotos.entries()) {
      await db.query("insert into public.gallery_photos (album_id, image_url, caption, width, height, sort_order) values ($1, $2, $3, $4, $5, $6)", [album.id, url, caption, width, height, (index + 1) * 10])
    }
    await db.query("commit")
    console.log(`Added ${products.length} products, ${categories.length} categories and the "Life in the paddock" album.`)
  } catch (error) {
    await db.query("rollback")
    throw error
  }
} else {
  console.log("Usage: node --env-file=.env.local scripts/catalogue-seed.mjs on|off")
}
await db.end()
