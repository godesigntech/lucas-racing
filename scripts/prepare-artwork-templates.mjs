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

/** Grid the zones are compared on: coarse enough that dots and speckles don't get lines. */
const LINE_GRID = 1024
/** Racing tape width, as a share of the texture: about 5 mm on the helmet. */
const LINE_WIDTH = 0.0035

/**
 * Racing lines: tape along the borders between the design's colour zones, where the
 * workshop would run a pinstripe. Found on a coarse grid, so only real section edges count.
 */
async function racingLines(masks, zones, rgba) {
  const block = SIZE / LINE_GRID
  const zoneAt = new Int8Array(LINE_GRID * LINE_GRID).fill(-1)
  for (let y = 0; y < LINE_GRID; y++) {
    for (let x = 0; x < LINE_GRID; x++) {
      const votes = new Array(zones.length).fill(0)
      let inside = 0
      for (let dy = 0; dy < block; dy += 2) {
        for (let dx = 0; dx < block; dx += 2) {
          const index = (y * block + dy) * SIZE + x * block + dx
          if (rgba[index * 4 + 3] === 0) continue
          inside++
          zones.forEach((zone, z) => {
            if (masks[zone][index]) votes[z]++
          })
        }
      }
      if (inside > 0) zoneAt[y * LINE_GRID + x] = votes.indexOf(Math.max(...votes))
    }
  }
  // Two passes of a majority filter remove what's left of small dots.
  let smooth = zoneAt
  for (let pass = 0; pass < 2; pass++) {
    const next = smooth.slice()
    for (let y = 1; y < LINE_GRID - 1; y++) {
      for (let x = 1; x < LINE_GRID - 1; x++) {
        if (smooth[y * LINE_GRID + x] === -1) continue
        const counts = new Map()
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const zone = smooth[(y + dy) * LINE_GRID + x + dx]
            if (zone !== -1) counts.set(zone, (counts.get(zone) ?? 0) + 1)
          }
        }
        next[y * LINE_GRID + x] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
      }
    }
    smooth = next
  }

  // Each zone is scaled up as a soft mask; a border is where two zones overlap, which
  // gives smooth lines rather than the grid's steps.
  const soft = await Promise.all(
    zones.map((_, z) => {
      const grid = Buffer.alloc(LINE_GRID * LINE_GRID)
      for (let index = 0; index < grid.length; index++) grid[index] = smooth[index] === z ? 255 : 0
      return sharp(grid, { raw: { width: LINE_GRID, height: LINE_GRID, channels: 1 } })
        .resize(MASK_SIZE, MASK_SIZE, { kernel: "cubic" })
        .blur(LINE_WIDTH * MASK_SIZE * 0.6)
        .extractChannel(0)
        .raw()
        .toBuffer()
    }),
  )
  const out = Buffer.alloc(MASK_SIZE * MASK_SIZE)
  for (let index = 0; index < out.length; index++) {
    let first = 0
    let second = 0
    for (const mask of soft) {
      const value = mask[index]
      if (value > first) [first, second] = [value, first]
      else if (value > second) second = value
    }
    // Two zones both present here: full tape where they're even, fading out either side.
    const t = Math.min(1, Math.max(0, (second / 255 - 0.22) / 0.16))
    out[index] = Math.round(t * t * (3 - 2 * t) * 255)
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
  await sharp(await racingLines(masks, template.zones, rgba), { raw: { width: MASK_SIZE, height: MASK_SIZE, channels: 1 } }).png({ compressionLevel: 9 }).toFile(path.join(out, "lines-mask.png"))
  console.log(`${template.slug}: artwork, ${template.zones.length} zone masks and racing lines`)
}
