// Turns the designers' full-colour SVG artwork into what the 3D builder loads, in
// public/models/templates/bell-kc7/<slug>/:
//   artwork.webp        the design itself, in the shell's UVs, with edges grown so seams stay clean
//   <zone>-mask.png     one mask per colour zone, so customers can still recolour each zone
//
//   node scripts/prepare-artwork-templates.mjs "<folder with the SVGs>" [slug ...]
//
// Pass slugs to build only those designs (their SVGs must be in that folder).
// To add a design, add it to `templates` and add its rows in a migration.
//
// Two kinds of artwork:
//   - drawn on the whole square UV sheet (the first designs): used as it is;
//   - `fit: true`: just the helmet's outline, cropped or on a 2:1 sheet with a black
//     background. The background is dropped and the outline is fitted to the shell's
//     UV band (SHELL_BAND), the same layout the designer drew on.

import { readFileSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const [svgDir, ...onlySlugs] = process.argv.slice(2)
if (!svgDir) throw new Error('Usage: node scripts/prepare-artwork-templates.mjs "<folder with the SVGs>" [slug ...]')

const SIZE = 4096
/** The builder packs masks at this size, so they needn't be larger. */
const MASK_SIZE = 2048
/**
 * How far the artwork is grown past its edge, so filtering never picks up black. A design
 * drawn on an older UV guide can stop short of the shell in places (the eyeport edge on
 * some of the second set); those set a larger `gutter` so its edge colours reach the shell.
 */
const GUTTER = 32
/** Where the shell's UVs sit on the texture, as shares of its width and height (Bell KC7). */
const SHELL_BAND = { left: 0.003, top: 0.301, right: 0.997, bottom: 0.688 }

const between = (low, high) => (h) => h >= low && h <= high
const isRed = (h) => h < 25 || h > 335
const isCardinal = (h, s, v) => s >= 0.25 && v > 0.08
const isLight = (s, v) => s < 0.25 && v > 0.42
const isDark = (s, v) => v < 0.3 || (s < 0.25 && v <= 0.42)
const isPink = (h, s, v) => (h >= 280 || h < 5) && s > 0.3 && v > 0.3
const isGold = (h, s, v) => between(28, 62)(h) && s > 0.25 && v > 0.3

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
  // The second set of ten, numbered 1-10 by the 3D artist.
  {
    slug: "pink-blade",
    file: "1.svg",
    fit: true,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isPink(h, s, v) ? "graphic" : isLight(s, v) ? "accent" : "base"),
  },
  {
    slug: "navy-pink",
    file: "2.svg",
    fit: true,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isPink(h, s, v) ? "graphic" : isLight(s, v) ? "accent" : "base"),
  },
  {
    slug: "ivory-gold",
    file: "3.svg",
    fit: true,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isGold(h, s, v) ? "accent" : isDark(s, v) ? "graphic" : "base"),
  },
  {
    slug: "neon-volt",
    file: "4.svg",
    fit: true,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (between(45, 90)(h) && s > 0.35 && v > 0.45 ? "graphic" : isDark(s, v) ? "accent" : "base"),
  },
  {
    slug: "tricolore",
    file: "5.svg",
    fit: true,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (between(85, 175)(h) && s > 0.25 && v > 0.15 ? "graphic" : isCardinal(h, s, v) && (h < 45 || h > 335) ? "accent" : "base"),
  },
  {
    slug: "inferno",
    file: "6.svg",
    fit: true,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isLight(s, v) ? "accent" : between(46, 90)(h) && s > 0.35 ? "graphic" : "base"),
  },
  {
    slug: "strike-red",
    file: "7.svg",
    fit: true,
    gutter: 64,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isCardinal(h, s, v) && isRed(h) && s > 0.45 ? "graphic" : isLight(s, v) ? "accent" : "base"),
  },
  {
    slug: "red-fury",
    file: "8.svg",
    fit: true,
    gutter: 240,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isLight(s, v) ? "accent" : isCardinal(h, s, v) && isRed(h) && s > 0.45 && v > 0.3 ? "base" : "graphic"),
  },
  {
    slug: "sky-racer",
    file: "9.svg",
    fit: true,
    gutter: 64,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isCardinal(h, s, v) && isRed(h) && s > 0.45 ? "graphic" : between(180, 250)(h) && s > 0.3 && v > 0.25 ? "base" : isLight(s, v) ? "accent" : "base"),
  },
  {
    slug: "gold-line",
    file: "10.svg",
    fit: true,
    gutter: 64,
    zones: ["base", "graphic", "accent"],
    zoneOf: (h, s, v) => (isGold(h, s, v) ? "accent" : isDark(s, v) ? "graphic" : "base"),
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
function growEdges(rgba, gutter = GUTTER) {
  let source = new Int32Array(SIZE * SIZE).fill(-1)
  for (let index = 0; index < SIZE * SIZE; index++) if (rgba[index * 4 + 3] >= 200) source[index] = index
  for (let pass = 0; pass < gutter; pass++) {
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

/**
 * The helmet's outline on artwork traced over black: the rows and columns that hold
 * light-coloured pixels (its outer edge is drawn in light grey). A few stray pixels
 * don't count. The design's own blacks are kept; only the measuring ignores them.
 */
function lightBounds(rgba, width, height) {
  const isLight = (index) => rgba[index * 4 + 3] > 0 && Math.max(rgba[index * 4], rgba[index * 4 + 1], rgba[index * 4 + 2]) > 60
  const rows = new Uint32Array(height)
  const columns = new Uint32Array(width)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isLight(y * width + x)) continue
      rows[y]++
      columns[x]++
    }
  }
  const first = (counts, minimum) => counts.findIndex((count) => count > minimum)
  const last = (counts, minimum) => counts.length - 1 - [...counts].reverse().findIndex((count) => count > minimum)
  const minRow = width * 0.002
  const minColumn = height * 0.002
  return { left: first(columns, minColumn), top: first(rows, minRow), right: last(columns, minColumn), bottom: last(rows, minRow) }
}

/**
 * Vector designs can leave see-through gaps between their shapes. Gaps inside the helmet's
 * outline (not reachable from the sheet's edge) are filled with the colours around them,
 * blurred wider and wider until every gap has a colour.
 */
async function fillHoles(rgba, width, height) {
  const outside = new Uint8Array(width * height)
  const clear = (index) => rgba[index * 4 + 3] < 128
  const stack = []
  for (let x = 0; x < width; x++) stack.push(x, (height - 1) * width + x)
  for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1)
  while (stack.length) {
    const index = stack.pop()
    if (outside[index] || !clear(index)) continue
    outside[index] = 1
    const x = index % width
    if (x > 0) stack.push(index - 1)
    if (x < width - 1) stack.push(index + 1)
    if (index >= width) stack.push(index - width)
    if (index < width * (height - 1)) stack.push(index + width)
  }
  let holes = []
  for (let index = 0; index < width * height; index++) if (clear(index) && !outside[index]) holes.push(index)
  for (const sigma of [8, 32, 128]) {
    if (holes.length === 0) break
    // Blur colour weighted by opacity, then divide by blurred opacity: the average colour nearby.
    const weighted = Buffer.alloc(width * height * 4)
    for (let index = 0; index < width * height; index++) {
      const alpha = rgba[index * 4 + 3] / 255
      weighted[index * 4] = rgba[index * 4] * alpha
      weighted[index * 4 + 1] = rgba[index * 4 + 1] * alpha
      weighted[index * 4 + 2] = rgba[index * 4 + 2] * alpha
      weighted[index * 4 + 3] = rgba[index * 4 + 3]
    }
    const blurred = await sharp(weighted, { raw: { width, height, channels: 4 } }).blur(sigma).raw().toBuffer()
    holes = holes.filter((index) => {
      const alpha = blurred[index * 4 + 3]
      if (alpha < 8) return true
      for (let channel = 0; channel < 3; channel++) rgba[index * 4 + channel] = Math.min(255, Math.round((blurred[index * 4 + channel] * 255) / alpha))
      rgba[index * 4 + 3] = 255
      return false
    })
  }
}

/**
 * An outline-only design, fitted to the shell's UV band on a square sheet. Designs on a
 * transparent sheet are trimmed to what's drawn; designs traced over black are measured
 * by their light outline instead, since the black around them isn't transparent.
 */
async function renderFitted(file) {
  const source = readFileSync(file, "utf8")
  const tracedOnBlack = /id="Black_background"/.test(source)
  const svg = source.replace(/<rect[^>]*id="Black_background"[^>]*\/>/g, "")
  const meta = await sharp(Buffer.from(svg), { limitInputPixels: false }).metadata()
  // Rendered a little larger than it's used, then cropped to the outline.
  const density = Math.min(600, (72 * SIZE * 1.25) / meta.width)
  const rendered = sharp(Buffer.from(svg), { density, limitInputPixels: false }).ensureAlpha()
  let outline
  if (tracedOnBlack) {
    const { data, info } = await rendered.raw().toBuffer({ resolveWithObject: true })
    const box = lightBounds(data, info.width, info.height)
    outline = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
      .extract({ left: box.left, top: box.top, width: box.right - box.left + 1, height: box.bottom - box.top + 1 })
      .png()
      .toBuffer()
  } else {
    outline = await rendered.trim({ threshold: 0 }).png().toBuffer()
  }
  const width = Math.round((SHELL_BAND.right - SHELL_BAND.left) * SIZE)
  const height = Math.round((SHELL_BAND.bottom - SHELL_BAND.top) * SIZE)
  const resized = await sharp(outline).resize(width, height, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true })
  if (!tracedOnBlack) await fillHoles(resized.data, width, height)
  const placed = await sharp(resized.data, { raw: { width, height, channels: 4 } }).png().toBuffer()
  return (
    await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: placed, left: Math.round(SHELL_BAND.left * SIZE), top: Math.round(SHELL_BAND.top * SIZE) }])
      .raw()
      .toBuffer()
  )
}

for (const template of templates.filter((item) => onlySlugs.length === 0 || onlySlugs.includes(item.slug))) {
  const file = path.join(svgDir, template.file)
  const raster = template.fit ? await renderFitted(file) : await renderSvg(file)
  const rgba = growEdges(raster, template.gutter)

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
  const share = (zone) => Math.round((masks[zone].reduce((sum, value) => sum + (value ? 1 : 0), 0) / masks[template.zones[0]].length) * 1000) / 10
  console.log(`${template.slug}: artwork, ${template.zones.length} zone masks and racing lines (${template.zones.map((zone) => `${zone} ${share(zone)}%`).join(", ")})`)
}
