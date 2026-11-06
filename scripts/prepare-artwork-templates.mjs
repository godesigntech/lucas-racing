// Turns the designers' full-colour SVG artwork into what the 3D builder loads, in
// public/models/templates/bell-kc7/<slug>/:
//   artwork.webp        the design itself, in the shell's UVs, with edges grown so seams stay clean
//   <zone>-mask.png     one mask per colour zone, so customers can still recolour each zone
//
//   node scripts/prepare-artwork-templates.mjs "<folder with the SVGs>"
//
// To add a design, add it to `templates` and add its rows in a migration.

import { mkdir } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const [svgDir] = process.argv.slice(2)
if (!svgDir) throw new Error('Usage: node scripts/prepare-artwork-templates.mjs "<folder with the SVGs>"')

const SIZE = 4096
/** The builder packs masks at this size, so they needn't be larger. */
const MASK_SIZE = 2048
/** How far the artwork is grown past its edge, so filtering never picks up black. */
const GUTTER = 16

const between = (low, high) => (h) => h >= low && h <= high
const isRed = (h) => h < 25 || h > 335
const isCardinal = (h, s, v) => s >= 0.25 && v > 0.08
const isLight = (s, v) => s < 0.25 && v > 0.42

/** Sorts a pixel into a zone. Anything undecided stays with the dark base. */
const templates = [
  {
    slug: "emilio",
    file: "NewUV-01-Emilio.svg",
    zones: ["base", "graphic", "accent", "detail"],
    // Navy shades are the base; the brighter blue panels, gold and teal lines are zones.
    zoneOf: (h, s, v) => {
      if (between(30, 65)(h) && s > 0.25 && v > 0.35) return "accent"
      if (between(180, 212)(h) && s > 0.25 && v > 0.4) return "detail"
      if (between(205, 245)(h) && v > 0.28) return "graphic"
      return "base"
    },
  },
  {
    slug: "nygel",
    file: "NewUV-02-Nygel.svg",
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isCardinal(h, s, v) && isRed(h) ? "graphic" : isLight(s, v) ? "accent" : "base"),
  },
  {
    slug: "rusinov",
    file: "NewUV-03-Rusinov.svg",
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isCardinal(h, s, v) && isRed(h) ? "graphic" : isLight(s, v) ? "accent" : "base"),
  },
]

function hsv(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let hue = 0
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta + 6) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
  }
  return [hue * 60, max === 0 ? 0 : delta / max, max / 255]
}

/** Copies each pixel just outside the artwork from its nearest neighbour inside it. */
function growEdges(rgba) {
  let source = new Int32Array(SIZE * SIZE).fill(-1)
  for (let index = 0; index < SIZE * SIZE; index++) if (rgba[index * 4 + 3] >= 200) source[index] = index
  for (let pass = 0; pass < GUTTER; pass++) {
    const grown = source.slice()
    for (let y = 1; y < SIZE - 1; y++) {
      for (let x = 1; x < SIZE - 1; x++) {
        const at = y * SIZE + x
        if (source[at] !== -1) continue
        for (const step of [-1, 1, -SIZE, SIZE]) {
          if (source[at + step] !== -1) {
            grown[at] = source[at + step]
            break
          }
        }
      }
    }
    source = grown
  }
  const out = Buffer.alloc(rgba.length)
  for (let index = 0; index < SIZE * SIZE; index++) {
    const from = source[index]
    if (from === -1) continue
    out[index * 4] = rgba[from * 4]
    out[index * 4 + 1] = rgba[from * 4 + 1]
    out[index * 4 + 2] = rgba[from * 4 + 2]
    out[index * 4 + 3] = 255
  }
  return out
}

const renderSvg = async (file) =>
  (await sharp(file, { density: 300 }).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data

for (const template of templates) {
  const raster = await renderSvg(path.join(svgDir, template.file))
  const rgba = growEdges(raster)

  const artwork = Buffer.alloc(SIZE * SIZE * 3)
  const masks = Object.fromEntries(template.zones.map((zone) => [zone, Buffer.alloc(SIZE * SIZE)]))
  for (let index = 0; index < SIZE * SIZE; index++) {
    if (rgba[index * 4 + 3] === 0) continue
    const [r, g, b] = [rgba[index * 4], rgba[index * 4 + 1], rgba[index * 4 + 2]]
    artwork[index * 3] = r
    artwork[index * 3 + 1] = g
    artwork[index * 3 + 2] = b
    masks[template.zoneOf(...hsv(r, g, b))][index] = 255
  }

  const out = path.join("public/models/templates/bell-kc7", template.slug)
  await mkdir(out, { recursive: true })
  await sharp(artwork, { raw: { width: SIZE, height: SIZE, channels: 3 } }).webp({ quality: 90, smartSubsample: true }).toFile(path.join(out, "artwork.webp"))
  for (const [zone, mask] of Object.entries(masks)) {
    await sharp(mask, { raw: { width: SIZE, height: SIZE, channels: 1 } }).resize(MASK_SIZE, MASK_SIZE).png({ compressionLevel: 9 }).toFile(path.join(out, `${zone}-mask.png`))
  }
  console.log(`${template.slug}: artwork and ${template.zones.length} zone masks`)
}
