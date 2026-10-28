import type { ConfiguratorOption, Film } from "@/types/catalog"
import type { HelmetModel } from "@/types/helmet"
import type { Product } from "@/types/product"
import type { SiteSettings } from "@/types/settings"
import type { AeroKit, DesignTemplate, TemplateRegion, Visor } from "@/types/templates"

// Sample data for demo mode. Mirrors supabase/migrations/*_seed.sql.

const timestamps = { sortOrder: 0, isActive: true }

export const demoSettings: SiteSettings = {
  businessName: "Lucas Racing",
  partnerName: "Hydro Karts",
  contactEmail: "hello@lucasracing.co.uk",
  contactPhone: "+44 (0)1642 000 000",
  location: "North East England",
  addressNote: "Workshop address to be confirmed",
  openingHours: "Mon–Fri, 9:00–17:30",
  eventName: "Kartmania",
  eventDates: "14–15 November 2026",
  showEventBanner: true,
  kartPartsLive: false,
  showNews: true,
  showGallery: true,
  socialLinks: [
    { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/" },
    { label: "Facebook", icon: "facebook", href: "https://www.facebook.com/" },
    { label: "YouTube", icon: "youtube", href: "https://www.youtube.com/" },
    { label: "TikTok", icon: "tiktok", href: "https://www.tiktok.com/" },
  ],
  deliveryMethods: [
    { id: "courier", label: "Tracked UK courier", description: "Sent 2–3 working days after your helmet is finished.", price: 12, requiresAddress: true, active: true },
    { id: "collection", label: "Collect from the workshop", description: "We will message you when it is ready to collect.", price: 0, requiresAddress: false, active: true },
    { id: "track", label: "Track-side handover", description: "Selected tracks in the North East and Yorkshire, arranged by message.", price: 0, requiresAddress: false, active: true },
  ],
}

const sizes = ["XS", "S", "M", "L", "XL", "XXL"]

export const demoModels: HelmetModel[] = [
  { id: "arai-sk6", brand: "Arai", name: "Arai SK-6", shortName: "SK-6", summary: "The shell most UK karters already race in. Our launch helmet.", newHelmetPrice: 549, sizes, isActive: true, sortOrder: 1 },
  { id: "bell-kc7", brand: "Bell", name: "Bell KC7", shortName: "KC7", summary: "Bell's karting shell, with a sharper visor line and chin vent.", newHelmetPrice: 499, sizes, isActive: true, sortOrder: 2 },
]

export const demoFilms: Film[] = [
  { id: "none", name: "Solid colour", code: "SOLID", category: "Solid", pattern: "none", price: 0, textureUrl: null, thumbUrl: null, widths: [], ...timestamps },
  { id: "tshy241", name: "Carbon fibre TSHY241", code: "TSHY241", category: "Carbon fibre", pattern: "carbon", price: 45, textureUrl: "/films/carbon/tshy241.webp", thumbUrl: "/films/carbon/thumbs/tshy241.webp", widths: ["0.5m"], ...timestamps, sortOrder: 1 },
  { id: "tsmd11512", name: "Camo TSMD11512", code: "TSMD11512", category: "Camo", pattern: "camo", price: 45, textureUrl: "/films/camo/tsmd11512.webp", thumbUrl: "/films/camo/thumbs/tsmd11512.webp", widths: ["1m"], ...timestamps, sortOrder: 2 },
  { id: "tswd10610", name: "Wood TSWD10610", code: "TSWD10610", category: "Wood", pattern: "none", price: 45, textureUrl: "/films/wood/tswd10610.webp", thumbUrl: "/films/wood/thumbs/tswd10610.webp", widths: ["1m"], ...timestamps, sortOrder: 3 },
  { id: "tsdd125-10", name: "Marble & water drop TSDD125-10", code: "TSDD125-10", category: "Marble & water drop", pattern: "none", price: 45, textureUrl: "/films/marble/tsdd125-10.webp", thumbUrl: "/films/marble/thumbs/tsdd125-10.webp", widths: ["1m"], ...timestamps, sortOrder: 4 },
  { id: "tscy860", name: "Skull TSCY860", code: "TSCY860", category: "Skull", pattern: "none", price: 45, textureUrl: "/films/skull/tscy860.webp", thumbUrl: "/films/skull/thumbs/tscy860.webp", widths: ["1m"], ...timestamps, sortOrder: 5 },
]

const option = (
  group: ConfiguratorOption["group"],
  value: string,
  label: string,
  /** Null mirrors a real option the client hasn't priced yet. */
  price: number | null,
  sortOrder: number,
  extra: { hint?: string; swatch?: string } = {},
): ConfiguratorOption => ({ group, value, label, price, sortOrder, isActive: true, hint: extra.hint ?? null, swatch: extra.swatch ?? null })

export const demoOptions: ConfiguratorOption[] = [
  option("route", "new", "Supply a new helmet", 0, 1, { hint: "We order it in your size" }),
  option("route", "own", "Send my own helmet", 0, 2, { hint: "Post it or drop it off" }),
  option("finish", "gloss", "Gloss", 0, 1),
  option("finish", "matte", "Matte", 25, 2),
  option("finish", "chrome", "Chrome", 150, 3, { hint: "In-house chrome base" }),
  option("material", "chrome", "Chrome", 150, 1, { swatch: "#c9ccd1", hint: "Polished in-house chrome" }),
  // Prices the client hasn't confirmed: previewable, but checkout stops on them.
  option("material", "metallic", "Metallic", null, 2, { swatch: "#b8bdc4" }),
  option("visor_strip", "none", "No visor strip", 0, 1),
  option("visor_strip", "printed", "Printed visor strip", null, 2),
  option("personalisation", "name", "Name", 0, 1),
  option("personalisation", "number", "Racing number", 0, 2),
  option("personalisation", "initials", "Initials", 0, 3),
  option("personalisation", "flag", "National flag", 0, 4),
  option("personalisation", "text", "Custom text", 0, 5),
  option("base", "#f4f3ee", "Paddock white", 0, 1, { swatch: "#f4f3ee" }),
  option("base", "#111412", "Carbon black", 0, 2, { swatch: "#111412" }),
  option("base", "#d7261e", "Race red", 0, 3, { swatch: "#d7261e" }),
  option("base", "#1f5bd8", "Grid blue", 0, 4, { swatch: "#1f5bd8" }),
  option("base", "#ff6a13", "Flag orange", 0, 5, { swatch: "#ff6a13" }),
  option("base", "#c6f432", "Lucas lime", 0, 6, { swatch: "#c6f432" }),
  option("trim", "#111412", "Black", 0, 1, { swatch: "#111412" }),
  option("trim", "#f4f3ee", "White", 20, 2, { swatch: "#f4f3ee" }),
  option("trim", "#d7261e", "Red", 20, 3, { swatch: "#d7261e" }),
  option("trim", "#1f5bd8", "Blue", 20, 4, { swatch: "#1f5bd8" }),
  option("trim", "#c6f432", "Lime", 20, 5, { swatch: "#c6f432" }),
  option("spoiler", "yes", "Fitted", 35, 1),
  option("spoiler", "no", "None", 0, 2),
]

const clearCoat = { label: "Clear coat", value: "2K automotive lacquer, gloss or matte" }
const approval = { label: "Approval", value: "Digital proof signed off before we start" }
const handover = { label: "Handover", value: "Courier, workshop collection or track-side" }
const both = ["arai-sk6", "bell-kc7"]

export const demoProducts: Product[] = [
  {
    id: "demo-apex", slug: "apex", name: "Apex", tagline: "One long sweep from brow to base.",
    description: "A single aggressive sweep that starts above the visor and pulls back over the shell, finished with a fine pinstripe. Easy to read from the grandstand and easy to make your own.",
    category: "racing-lines", models: both, startingPrice: 295, badge: "Launch design",
    features: ["Sweep, pinstripe and base colour are each editable", "Driver name and number positions built in", "Works on both launch shells"],
    specs: [{ label: "Editable areas", value: "Base, sweep, pinstripe" }, clearCoat, approval, handover],
    look: { layout: "apex", finish: "gloss", base: "#f4f3ee", graphic: "#111412", accent: "#c6f432", film: "none", trim: "#111412", spoiler: true, number: "29", name: "LUCAS" },
    isActive: true, sortOrder: 1,
  },
  {
    id: "demo-twin-stripe", slug: "twin-stripe", name: "Twin Stripe", tagline: "Classic double centre stripes.",
    description: "Two parallel stripes run nose to tail over the crown. A timeless layout that looks right in team colours and suits a chrome or matte base.",
    category: "racing-lines", models: both, startingPrice: 245, badge: "Launch design",
    features: ["Stripe width and spacing set for each shell", "Choose a film for the stripes or keep them solid", "Pairs with any rubber trim colour"],
    specs: [{ label: "Editable areas", value: "Base, stripes" }, clearCoat, approval, handover],
    look: { layout: "twin", finish: "gloss", base: "#1f5bd8", graphic: "#f4f3ee", accent: "#111412", film: "none", trim: "#f4f3ee", spoiler: false, number: "7" },
    isActive: true, sortOrder: 2,
  },
  {
    id: "demo-split-tone", slug: "split-tone", name: "Split Tone", tagline: "Two colours, one hard edge.",
    description: "The shell splits front and rear with a sharp angled line and a lime pinstripe on the seam. Bold, simple and quick to turn around.",
    category: "racing-lines", models: both, startingPrice: 225, badge: "Launch design",
    features: ["Front and rear colours set independently", "Seam pinstripe in any colour", "Quickest turnaround in the range"],
    specs: [{ label: "Editable areas", value: "Front, rear, seam" }, clearCoat, approval, handover],
    look: { layout: "split", finish: "matte", base: "#d7261e", graphic: "#111412", accent: "#c6f432", film: "none", trim: "#111412", spoiler: true, number: "14" },
    isActive: true, sortOrder: 3,
  },
  {
    id: "demo-shard", slug: "shard", name: "Shard", tagline: "Broken glass shards in carbon.",
    description: "Angular shards break across the side of the shell, each one dipped in carbon film. Looks sharp up close and reads as pure speed from a distance.",
    category: "hydro-dip", models: both, startingPrice: 325, badge: "Most popular",
    features: ["Shards dipped in any film from the library", "Tint the film: carbon plus orange is orange carbon", "Number panel kept clear for legibility"],
    specs: [{ label: "Editable areas", value: "Base, shards, accent" }, { label: "Film", value: "Carbon weave as standard" }, clearCoat, approval],
    look: { layout: "shard", finish: "gloss", base: "#ff6a13", graphic: "#1b1d1b", accent: "#f4f3ee", film: "carbon", trim: "#111412", spoiler: true, number: "88" },
    isActive: true, sortOrder: 4,
  },
  {
    id: "demo-forged-flow", slug: "forged-flow", name: "Forged Flow", tagline: "A wave of forged carbon.",
    description: "A flowing wave runs the length of the shell in forged-carbon film, set against a clean base. One of the most requested looks from the Hydro Karts workshop.",
    category: "hydro-dip", models: both, startingPrice: 365, badge: "New",
    features: ["Forged carbon or any other library film", "Wave edges masked by hand for a crisp line", "Gloss or matte lacquer"],
    specs: [{ label: "Editable areas", value: "Base, wave" }, { label: "Film", value: "Forged carbon as standard" }, clearCoat, approval],
    look: { layout: "flow", finish: "gloss", base: "#f4f3ee", graphic: "#2a2d2b", accent: "#c6f432", film: "forged", trim: "#c6f432", spoiler: false, number: "3" },
    isActive: true, sortOrder: 5,
  },
  {
    id: "demo-hex-halo", slug: "hex-halo", name: "Hex Halo", tagline: "A hexagon band around the head.",
    description: "A wide halo band circles the helmet at brow height in hex-pattern film. A technical look that pairs well with team-colour rubbers.",
    category: "hydro-dip", models: ["arai-sk6"], startingPrice: 335,
    features: ["Halo band in hex, carbon or camo film", "Upper and lower shell colours set separately", "Arai SK-6 only at launch"],
    specs: [{ label: "Editable areas", value: "Base, halo band" }, { label: "Film", value: "Hex as standard" }, clearCoat, approval],
    look: { layout: "halo", finish: "matte", base: "#111412", graphic: "#c6f432", accent: "#f4f3ee", film: "hex", trim: "#c6f432", spoiler: true, number: "11" },
    isActive: true, sortOrder: 6,
  },
  {
    id: "demo-chrome-strike", slug: "chrome-strike", name: "Chrome Strike", tagline: "Mirror chrome under a black sweep.",
    description: "A full chrome base, done in-house, with a black sweep and pinstripe laid over it. The chrome catches every light in the paddock.",
    category: "chrome", models: both, startingPrice: 445,
    features: ["In-house chrome as the base finish", "Graphics and candy tints sit over the chrome", "Clear coat protects the mirror finish"],
    specs: [{ label: "Base", value: "Chrome, applied in-house" }, { label: "Editable areas", value: "Sweep, pinstripe" }, approval, handover],
    look: { layout: "apex", finish: "chrome", base: "#c9ccd1", graphic: "#111412", accent: "#d7261e", film: "none", trim: "#111412", spoiler: true, number: "1" },
    isActive: true, sortOrder: 7,
  },
  {
    id: "demo-blank-canvas", slug: "blank-canvas", name: "Blank Canvas", tagline: "Your idea, designed with the workshop.",
    description: "Start from a plain shell and work with the Hydro Karts team on a design that is completely yours. You share references; we come back with proofs and a fixed quote.",
    category: "bespoke", models: both, startingPrice: null,
    features: ["Send sketches, liveries or photos as references", "Proofs and revisions before anything is painted", "Priced on request once the design is agreed"],
    specs: [{ label: "Process", value: "Brief, proof, revisions, quote" }, { label: "Films", value: "Full library, plus custom-printed film" }, clearCoat, handover],
    look: { layout: "blank", finish: "gloss", base: "#e8e7e0", graphic: "#111412", accent: "#c6f432", film: "none", trim: "#111412", spoiler: false },
    isActive: true, sortOrder: 8,
  },
]

// --- 16-step builder ---------------------------------------------------------
// Mirrors the 20261018* migrations: templates with editable regions, aero kits and
// visors. The Bell KC7 masks are the real artwork already in /public.

const region = (
  key: string,
  label: string,
  defaultColour: string,
  extra: Partial<TemplateRegion> = {},
): TemplateRegion => ({
  id: `demo-region-${key}`,
  key,
  label,
  kind: "fill",
  maskUrl: null,
  svgElementId: null,
  defaultColour,
  allowsFilm: true,
  allowsChrome: false,
  allowsMetallic: true,
  sortOrder: 0,
  ...extra,
})

const bellTemplate = (slug: string, sortOrder: number): DesignTemplate => {
  const path = `/models/templates/bell-kc7/${slug}`
  return {
    id: `demo-template-${slug}`,
    productSlug: slug,
    modelId: "bell-kc7",
    svgUrl: null,
    graphicMaskUrl: `${path}/graphic-mask.png`,
    accentMaskUrl: `${path}/accent-mask.png`,
    thumbnailUrl: `${path}/thumbnail.png`,
    artworkStatus: "ready",
    isActive: true,
    sortOrder,
    regions: [
      region("base", "Shell", "#101114", { allowsChrome: true, sortOrder: 1 }),
      region("graphic", "Graphic", "#d81f2a", { maskUrl: `${path}/graphic-mask.png`, sortOrder: 2 }),
      region("accent", "Pinstripe", "#f2f2f2", { kind: "pinstripe", maskUrl: `${path}/accent-mask.png`, sortOrder: 3 }),
    ],
  }
}

export const demoTemplates: DesignTemplate[] = [
  "apex",
  "twin-stripe",
  "split-tone",
  "shard",
  "forged-flow",
  "chrome-strike",
].map((slug, index) => bellTemplate(slug, index + 1))

export const demoAeroKits: AeroKit[] = [
  {
    id: "bell-kc7-standard",
    modelId: "bell-kc7",
    name: "Standard aero",
    summary: "The helmet as Bell supplies it.",
    meshName: null,
    price: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bell-kc7-hp7-small",
    modelId: "bell-kc7",
    name: "HP7 F1 small spoiler",
    summary: "Low-profile rear spoiler.",
    meshName: "Spoiler_HP7_F1_Small",
    // Not priced yet: previewable, but checkout stops on it.
    price: null,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "arai-sk6-standard",
    modelId: "arai-sk6",
    name: "Standard aero",
    summary: "The helmet as Arai supplies it.",
    meshName: null,
    price: 0,
    isActive: true,
    sortOrder: 1,
  },
]

const visor = (id: string, modelId: string, name: string, kind: Visor["kind"], tint: string, opacity: number, metalness: number, price: number | null, sortOrder: number): Visor => ({
  id,
  modelId,
  name,
  kind,
  tint,
  opacity,
  metalness,
  price,
  isActive: true,
  sortOrder,
})

export const demoVisors: Visor[] = demoModels.flatMap((model) => [
  visor(`clear-${model.id}`, model.id, "Clear", "clear", "#ffffff", 0.12, 0, 0, 1),
  visor(`smoked-${model.id}`, model.id, "Smoked", "smoked", "#2b2f36", 0.72, 0, null, 2),
  visor(`iridium-silver-${model.id}`, model.id, "Iridium silver", "iridium", "#c9d4e2", 0.62, 0.85, null, 3),
  visor(`iridium-blue-${model.id}`, model.id, "Iridium blue", "iridium", "#3f6ad8", 0.62, 0.85, null, 4),
])
