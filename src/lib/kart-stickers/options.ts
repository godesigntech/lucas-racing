/**
 * Kart sticker kits: the bodywork customers can design for, and the vinyl finishes.
 * A layout with a picture can be designed on: the picture is the kit's panels as plain
 * white shapes with an outline (scripts/trace-kart-layout.mjs makes one from a finished
 * kit preview we own). Those without one are listed as "coming soon".
 *
 * To switch one on: put its blank layout in public/kart-stickers/layouts/ and give it
 * `image`, `width`, `height` and `parts` below.
 */
export interface KartLayout {
  id: string
  name: string
  /** Which karts it fits, shown to the customer. */
  fits: string
  /** The panels in the picture, for the customer and for the AI. */
  parts?: string
  image?: string
  width?: number
  height?: number
}

/** A layout that can be designed on now. */
export type ReadyKartLayout = Required<KartLayout>

export function isReadyLayout(layout: KartLayout): layout is ReadyKartLayout {
  return Boolean(layout.image && layout.parts && layout.width && layout.height)
}

export const kartLayouts: KartLayout[] = [
  {
    id: "kg507",
    name: "KG 507",
    fits: "Karts with the KG 507 bodywork (full kit)",
    parts: "a three-piece nassau front panel (top), a front bumper in five pieces (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg507.png",
    width: 360,
    height: 360,
  },
  { id: "kg-508", name: "KG 508", fits: "Karts with the KG 508 bodywork (full kit)",
    parts: "a nassau front panel with two angled side wings and a lower piece (top), a front bumper in five pieces (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg-508.png", width: 360, height: 360 },
  { id: "kg-509", name: "KG 509", fits: "Karts with the KG 509 bodywork (full kit)",
    parts: "a tall nassau front panel with two side wings (top), a wide front bumper (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg-509.png", width: 360, height: 360 },
  { id: "kg-mk27", name: "KG MK27", fits: "Karts with the KG MK27 bodywork",
    parts: "a Y-shaped nassau front panel with two angled wings (top), a wide front bumper (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg-mk27.png", width: 360, height: 360 },
  { id: "kg-mk20", name: "KG MK20", fits: "Karts with the KG MK20 bodywork (full kit)",
    parts: "a three-piece nassau front panel with a lower piece (top), a front bumper in several pieces with a two-piece centre (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg-mk20.png", width: 360, height: 360 },
  { id: "kg-mk14", name: "KG MK14", fits: "Karts with the KG MK14 bodywork (full kit)",
    parts: "a tapered nassau front panel (top), a front bumper in several pieces with a centre piece and two long wings (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg-mk14.png", width: 360, height: 360 },
  { id: "kg-506", name: "KG 506", fits: "Karts with the KG 506 bodywork (full kit)",
    parts: "a tapered nassau front panel (top), a front bumper in several pieces with a centre piece (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg-506.png", width: 360, height: 360 },
  { id: "kg-506-f1-freelive-evo", name: "KG 506 F1 Freelive Evo", fits: "Karts with the KG 506 F1 Freelive Evo bodywork (full kit)",
    parts: "a tapered nassau front panel (top), a front bumper in several pieces with a two-piece centre and small end pieces (middle), two side pods, each in an upper and lower piece (bottom left and bottom right), and two small rear pieces between them (bottom centre)",
    image: "/kart-stickers/layouts/kg-506-f1-freelive-evo.png", width: 360, height: 360 },
  { id: "kg-505-duo-evo", name: "KG 505 Duo Evo", fits: "Karts with the KG 505 Duo Evo bodywork (full kit)",
    parts: "a three-piece nassau front panel (top), a front bumper in several pieces with a two-piece centre and two wings (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/kg-505-duo-evo.png", width: 360, height: 360 },
  { id: "model-02", name: "02", fits: "Karts with the 02 bodywork (full kit)",
    parts: "a nassau front panel with a top bar, two side strips and a centre piece (top), a front bumper with a curved upper piece and a lower piece with two wings (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/model-02.png", width: 360, height: 360 },
  { id: "otk-m8", name: "OTK M8", fits: "Karts with the OTK M8 bodywork (full kit)",
    parts: "a slim nassau front panel in two tall side strips with a centre cut-out (top), a front bumper in upper and lower pieces (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/otk-m8.png", width: 360, height: 360 },
  { id: "otk-m7", name: "OTK M7", fits: "Karts with the OTK M7 bodywork (full kit)",
    parts: "a nassau front panel in two tall side strips with a centre number plate (top left), the nassau's two narrow side panels (top right), a front bumper in upper and lower pieces (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/otk-m7.png", width: 360, height: 360 },
  { id: "otk-m6", name: "OTK M6", fits: "Karts with the OTK M6 bodywork (full kit)",
    parts: "a tapered nassau front panel (top), a wide front bumper in upper and lower pieces (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/otk-m6.png", width: 360, height: 360 },
  { id: "otk-m5", name: "OTK M5", fits: "Karts with the OTK M5 bodywork (full kit)",
    parts: "a three-piece nassau front panel: a tapered centre with a small piece each side (top), a front bumper in several pieces (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/otk-m5.png", width: 360, height: 360 },
  { id: "otk-m4", name: "OTK M4", fits: "Karts with the OTK M4 bodywork (full kit)",
    parts: "a tapered nassau front panel (top), a front bumper in left and right halves with upper and lower pieces (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/otk-m4.png", width: 360, height: 360 },
  { id: "otk-m3", name: "OTK M3", fits: "Karts with the OTK M3 bodywork (full kit)",
    parts: "a tapered nassau front panel (top), a front bumper in left and right halves with upper and lower pieces (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/otk-m3.png", width: 360, height: 360 },
  { id: "new-age-3", name: "New Age 3", fits: "Karts with the New Age 3 bodywork (full kit)",
    parts: "a nassau front panel with a top piece and two side strips (top), a front bumper in several pieces with a two-piece centre (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/new-age-3.png", width: 360, height: 360 },
  { id: "new-age-2", name: "New Age 2", fits: "Karts with the New Age 2 bodywork (full kit)",
    parts: "a nassau front panel with a top bar, two side strips and a centre piece (top), a front bumper in several pieces with a two-piece centre and two wings (middle) and two side pods, each in several pieces (bottom left and bottom right)",
    image: "/kart-stickers/layouts/new-age-2.png", width: 360, height: 360 },
  { id: "new-age-cadet", name: "New Age Cadet", fits: "Karts with the New Age Cadet bodywork (full kit)",
    parts: "a small nassau front panel with a round top and two side strips (top), a front bumper in several pieces with a centre piece (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/new-age-cadet.png", width: 360, height: 360 },
  { id: "eurostar-dynamica", name: "Eurostar Dynamica", fits: "Karts with the Eurostar Dynamica bodywork (full kit)",
    parts: "a nassau front panel with a top piece, a lower piece and two side strips (top), a front bumper in several pieces with a rounded centre and two raised wings (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/eurostar-dynamica.png", width: 360, height: 360 },
  { id: "eurostar-agile", name: "Eurostar Agile", fits: "Karts with the Eurostar Agile bodywork (full kit)",
    parts: "a tapered nassau front panel with two side strips (top), a front bumper in several pieces with a V-shaped centre (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/eurostar-agile.png", width: 360, height: 360 },
  { id: "mini-dynamica", name: "Mini Dynamica", fits: "Karts with the Mini Dynamica bodywork (full kit)",
    parts: "a nassau front panel with a top piece, a lower piece and two side strips (top), a front bumper in several pieces with a rounded centre (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/mini-dynamica.png", width: 360, height: 360 },
  { id: "fp7-stilo-evo", name: "FP7 Stilo Evo", fits: "Karts with the FP7 Stilo Evo bodywork (full kit)",
    parts: "a tapered nassau front panel with two side strips (top), a front bumper in several pieces with a centre piece and two long wings (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/fp7-stilo-evo.png", width: 360, height: 360 },
  { id: "buru-stilo", name: "Buru Stilo", fits: "Karts with the Buru Stilo bodywork (full kit)",
    parts: "a nassau front panel with a top piece and two side strips (top), a front bumper in several pieces with a two-piece centre (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/buru-stilo.png", width: 360, height: 360 },
  { id: "freeline", name: "Freeline", fits: "Karts with the Freeline bodywork (full kit)",
    parts: "a nassau front panel with a round top, two side strips and a centre piece (top), a front bumper in several pieces with a centre and two raised wings (middle), two side pods, each in an upper and lower piece (bottom left and bottom right), and two small rear pieces between them (bottom centre)",
    image: "/kart-stickers/layouts/freeline.png", width: 360, height: 360 },
  { id: "unico", name: "Unico", fits: "Karts with the Unico bodywork (full kit)",
    parts: "a three-piece nassau front panel (top), a front bumper in several pieces with a small centre piece (middle) and two side pods, each in an upper and lower piece (bottom left and bottom right)",
    image: "/kart-stickers/layouts/unico.png", width: 360, height: 360 },
  { id: "puffo-bambino", name: "Puffo Bambino", fits: "Karts with the Puffo Bambino bodywork (full kit)",
    parts: "a small nassau front panel with a round top and two side strips (top), a front bumper in several pieces (middle) and two side pods (bottom left and bottom right)",
    image: "/kart-stickers/layouts/puffo-bambino.png", width: 360, height: 360 },
  { id: "bigfoot", name: "Bigfoot", fits: "Karts with the Bigfoot bodywork",
    parts: "a wide front fairing split into a centre V strip and two side sections (top), a lower front panel (bottom centre) and two narrow side panels (left and right)",
    image: "/kart-stickers/layouts/bigfoot.png", width: 360, height: 360 },
]

/** The layouts customers can design on now. */
export const readyKartLayouts = kartLayouts.filter(isReadyLayout)

export function findKartLayout(id: string | null | undefined): KartLayout | undefined {
  return kartLayouts.find((layout) => layout.id === id)
}

export const kartFinishes = ["gloss", "matt", "holographic", "chrome"] as const
export type KartFinish = (typeof kartFinishes)[number]

export const kartFinishLabels: Record<KartFinish, { label: string; hint: string }> = {
  gloss: { label: "Gloss vinyl", hint: "Bright colours with a shine" },
  matt: { label: "Matt vinyl", hint: "Smooth, no reflections" },
  holographic: { label: "Holographic vinyl", hint: "Rainbow foil that shifts in the light" },
  chrome: { label: "Chrome vinyl", hint: "Mirror-like metallic" },
}

/** How many AI designs each account can make a day (KART_DESIGNS_PER_DAY, 1 to 50). */
export const DEFAULT_KART_DESIGNS_PER_DAY = 5
export const MAX_KART_LOGOS = 4
