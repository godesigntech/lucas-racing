/**
 * Ready-made bespoke visor sticker designs. Each is an SVG in public/stickers/designs/,
 * drawn on the visor strip's 11 : 1 artboard (see deliverables/visor-sticker-guide-bell-kc7.svg),
 * whose parts are coloured by CSS classes (CorelDRAW's ".fil0 {fill:…}"). Customers pick
 * a design and recolour each part; their own text goes on top.
 *
 * To add one: put the SVG in public/stickers/designs/ and list it here with its colour parts.
 * Cut-out designs from the designer go through scripts/prepare-visor-stickers.mjs instead.
 */
import visorStickerDesigns from "./visor-sticker-designs.json"

export interface StickerDesignPart {
  /** The CSS class in the SVG that colours this part. */
  key: string
  label: string
  /** The colour it's drawn in. */
  colour: string
}

export interface StickerDesign {
  id: string
  name: string
  file: string
  parts: StickerDesignPart[]
  /**
   * A cut-out sticker drawn as a flat view of the visor (its top edge curving up at the
   * ends, transparent around it), rather than a full rectangle filling the strip. The
   * 3D view lays it along the visor's top edge (visor-strip.ts).
   */
  shaped?: boolean
}

export const stickerDesigns: StickerDesign[] = [
  {
    id: "blade",
    name: "Blade",
    file: "/stickers/designs/blade.svg",
    parts: [
      { key: "fil0", label: "Background", colour: "#000000" },
      { key: "fil1", label: "Blades", colour: "#bdbfc1" },
      { key: "fil3", label: "Strikes", colour: "#fafc07" },
    ],
  },
  // The 20 cut-out designs (scripts/prepare-visor-stickers.mjs).
  ...(visorStickerDesigns as StickerDesign[]),
]

export function findStickerDesign(id: string | undefined): StickerDesign | undefined {
  return id ? stickerDesigns.find((design) => design.id === id) : undefined
}

/** Each part's colour: the customer's choice, else the design's own. */
export function stickerColours(design: StickerDesign, chosen: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(design.parts.map((part) => [part.key, chosen[part.key] ?? part.colour]))
}

const svgCache = new Map<string, Promise<string>>()

/** The design's SVG with each part in its chosen colour, as a data URL ready to draw. */
export async function recolouredSticker(design: StickerDesign, chosen: Record<string, string> = {}): Promise<string> {
  let pending = svgCache.get(design.file)
  if (!pending) {
    pending = fetch(design.file).then((response) => {
      if (!response.ok) throw new Error(`Sticker design ${design.file} didn't load`)
      return response.text()
    })
    pending.catch(() => svgCache.delete(design.file))
    svgCache.set(design.file, pending)
  }
  let svg = await pending
  for (const [key, colour] of Object.entries(stickerColours(design, chosen))) {
    svg = svg.replace(new RegExp(`\\.${key}\\s*\\{fill:[^}]*\\}`), `.${key} {fill:${colour}}`)
    // Lines drawn in the same colour (cut-out designs).
    svg = svg.replace(new RegExp(`\\.${key}-st\\s*\\{stroke:[^}]*\\}`), `.${key}-st {stroke:${colour}}`)
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
