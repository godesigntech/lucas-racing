// Turns the designer's full-colour UV artwork (SVG, drawn on the Bell KC7's shell UVs) into
// what the 3D builder loads, in public/models/templates/bell-kc7/<slug>/:
//   artwork.webp        the design itself, with its UV islands grown so seams stay clean
//   <zone>-mask.png     one mask per colour zone, so customers can still recolour each zone
//
//   node scripts/prepare-artwork-templates.mjs "D:/downloads/lucasHelmentTemp"
//
// To add a design: add it to `templates` below, run this, and add its rows in a migration.

import { mkdir } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const sourceDir = process.argv[2]
if (!sourceDir) throw new Error('Usage: node scripts/prepare-artwork-templates.mjs "<folder with the SVGs>"')

const SIZE = 2048
/** How far each UV island is grown, so filtering at its edge never picks up black. */
const GUTTER = 12

const isRed = (h) => h < 25 || h > 335
const isLime = (h) => h >= 50 && h <= 95
const isTeal = (h) => h >= 165 && h <= 200

/** Sorts a pixel into a zone. Anything undecided stays with the dark base. */
const templates = [
  {
    slug: "red-carbon",
    file: "Red-Carbon-UV.svg",
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (s >= 0.25 && v > 0.08 ? (isRed(h) ? "graphic" : "base") : s < 0.25 && v > 0.42 ? "accent" : "base"),
  },
  {
    slug: "neon-carbon",
    file: "Neon-Carbon-UV.svg",
    zones: ["base", "graphic", "accent", "detail"],
    zoneOf: (h, s, v) => (s >= 0.25 && v > 0.08 ? (isLime(h) ? "graphic" : isTeal(h) ? "detail" : "base") : s < 0.25 && v > 0.42 ? "accent" : "base"),
  },
  {
    slug: "maple-racing",
    file: "Maple-Racing-UV.svg",
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (s >= 0.25 && v > 0.08 ? (isRed(h) ? "graphic" : "base") : s < 0.25 && v > 0.42 ? "accent" : "base"),
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

for (const template of templates) {
  const { data } = await sharp(path.join(sourceDir, template.file), { density: (72 * SIZE) / 1024 })
    .resize(SIZE, SIZE)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Which pixel each texel takes its colour from; -1 is outside every UV island.
  let source = new Int32Array(SIZE * SIZE).fill(-1)
  for (let index = 0; index < SIZE * SIZE; index++) if (data[index * 4 + 3] >= 200) source[index] = index
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

  const artwork = Buffer.alloc(SIZE * SIZE * 3)
  const masks = Object.fromEntries(template.zones.map((zone) => [zone, Buffer.alloc(SIZE * SIZE)]))
  for (let index = 0; index < SIZE * SIZE; index++) {
    const from = source[index]
    if (from === -1) continue
    const [r, g, b] = [data[from * 4], data[from * 4 + 1], data[from * 4 + 2]]
    artwork[index * 3] = r
    artwork[index * 3 + 1] = g
    artwork[index * 3 + 2] = b
    masks[template.zoneOf(...hsv(r, g, b))][index] = 255
  }

  const out = path.join("public/models/templates/bell-kc7", template.slug)
  await mkdir(out, { recursive: true })
  await sharp(artwork, { raw: { width: SIZE, height: SIZE, channels: 3 } }).webp({ quality: 92, smartSubsample: true }).toFile(path.join(out, "artwork.webp"))
  for (const [zone, mask] of Object.entries(masks)) {
    // A touch of blur, so a recoloured zone has a soft edge like the artwork does.
    await sharp(mask, { raw: { width: SIZE, height: SIZE, channels: 1 } }).blur(0.8).png({ compressionLevel: 9 }).toFile(path.join(out, `${zone}-mask.png`))
  }
  console.log(`${template.slug}: artwork and ${template.zones.length} zone masks`)
}
