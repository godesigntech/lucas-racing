// Turns the designers' Arai SK-6 SVG templates into what the 3D builder loads, in
// public/models/templates/arai-sk6/<slug>/: artwork.webp, one mask per colour zone
// (base-mask.png, graphic-mask.png, ...), lines-mask.png, and zones.json (each zone's
// colour, label and share of the shell, for the migration).
//
//   node scripts/prepare-sk6-artwork.mjs "<folder with the numbered SVG folders>" [slug ...]
//
// The SVGs are drawn on the SK-6's own UV sheet (2048 x 2048) with every colour as its
// own flat fill: "Surface_colour_*" is the helmet's background and "Colour_N_<hex>" the
// design colours. Each pixel is given to the nearest of those exact colours, so the zones
// follow the artwork precisely. The 3D preview takes up to four design zones besides the
// background and the racing lines, so near-identical shades are merged.

import { readFileSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const [svgRoot, ...onlySlugs] = process.argv.slice(2)
if (!svgRoot) throw new Error('Usage: node scripts/prepare-sk6-artwork.mjs "<folder>" [slug ...]')

const SIZE = 4096
const MASK_SIZE = 2048
const GUTTER = 32
const MAX_ZONES = 4
const ZONE_KEYS = ["graphic", "accent", "detail", "rim"]

/** Folder name → slug and display name. */
const templates = [
  { folder: "01 Navy and Lime", slug: "navy-lime", name: "Navy and Lime" },
  { folder: "02 Electric Blue", slug: "electric-blue", name: "Electric Blue" },
  { folder: "03 Red and Silver", slug: "red-silver", name: "Red and Silver" },
  { folder: "04 Red and Yellow", slug: "red-yellow", name: "Red and Yellow" },
  { folder: "05 Blue Current", slug: "blue-current", name: "Blue Current" },
  { folder: "06 Crimson Apex", slug: "crimson-apex", name: "Crimson Apex" },
  { folder: "07 Jade Circuit", slug: "jade-circuit", name: "Jade Circuit" },
  { folder: "08 Magenta Vector", slug: "magenta-vector", name: "Magenta Vector" },
  { folder: "09 Amber Vortex", slug: "amber-vortex", name: "Amber Vortex" },
  { folder: "10 Arctic Spear", slug: "arctic-spear", name: "Arctic Spear" },
]

/** The builder's paint palette: each zone defaults to its nearest swatch (orders are priced on these). */
const palette = [
  ["Paddock white", "#f4f3ee"], ["Carbon black", "#111412"], ["Race red", "#d7261e"], ["Grid blue", "#1f5bd8"],
  ["Flag orange", "#ff6a13"], ["Lucas lime", "#c6f432"], ["Navy", "#14254d"], ["Signal yellow", "#ffd000"],
  ["Racing green", "#1f9d55"], ["Purple", "#6a3fb5"], ["Pink", "#ff5fa2"], ["Silver", "#c4c7c9"],
  ["Gunmetal", "#4a4f55"], ["Gold", "#c9a227"], ["Teal", "#0f8b8d"], ["Burgundy", "#7d1f2b"],
]

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
/** Rough perceptual distance (redmean). */
function distance([r1, g1, b1], [r2, g2, b2]) {
  const rm = (r1 + r2) / 2
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2)
}
function hsv([r, g, b]) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d > 0) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, max === 0 ? 0 : d / max, max / 255]
}
const neutrals = new Set(["Paddock white", "Carbon black", "Silver", "Gunmetal"])
/** sRGB to CIE Lab, for perceptual colour matching. */
function lab(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
  })
  const xyz = [(r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, r * 0.2126 + g * 0.7152 + b * 0.0722, (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883]
  const [fx, fy, fz] = xyz.map((v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116))
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, k) => v - lab(b)[k]))
/** Nearest paint swatch (CIE Lab). Greys, whites and blacks only match the neutral swatches. */
function nearestSwatch(rgb) {
  const [, s] = hsv(rgb)
  const options = palette.filter((item) => (s < 0.18 ? neutrals.has(item[0]) : !neutrals.has(item[0])))
  return options.reduce((best, item) => (deltaE(rgb, hexToRgb(item[1])) < deltaE(rgb, hexToRgb(best[1])) ? item : best))
}
/** A plain colour name for the zone's label in the builder ("Navy", "Lime", ...). */
function colourName(rgb) {
  const [h, s, v] = hsv(rgb)
  if (s < 0.18) return v > 0.85 ? "White" : v > 0.55 ? "Silver" : v > 0.25 ? "Grey" : "Black"
  // Very dark colours read as their dark shade, whatever the hue.
  if (v < 0.3) return h >= 95 && h < 185 ? "Dark green" : h >= 185 && h < 260 ? "Navy" : h >= 345 || h < 20 ? "Dark red" : "Black"
  if (h < 12 || h >= 345) return v < 0.55 ? "Dark red" : "Red"
  if (h < 40) return v < 0.6 ? "Burnt orange" : "Orange"
  if (h < 52) return s < 0.45 ? "Cream" : "Amber"
  if (h < 66) return s < 0.45 ? "Cream" : "Yellow"
  if (h < 95) return "Lime"
  if (h < 150) return v < 0.4 ? "Dark green" : "Green"
  if (h < 185) return s < 0.45 ? "Mint" : v < 0.4 ? "Dark green" : "Teal"
  if (h < 205) return s < 0.5 || v > 0.75 ? "Light blue" : "Teal blue"
  if (h < 245) return v < 0.45 ? "Navy" : v > 0.8 && s < 0.5 ? "Light blue" : "Blue"
  if (h < 290) return "Purple"
  return "Magenta"
}

// Shared with scripts/prepare-artwork-templates.mjs.
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


/** The SVG's colours: the background ("Surface") and each design colour, in drawing order. */
function svgColours(source) {
  const background = /id="Surface_colour_\d+" fill="(#[0-9A-Fa-f]{6})"/.exec(source)?.[1]
  const design = [...new Set([...source.matchAll(/id="Colour_\d+_[0-9A-Fa-f]{6}_part_\d+" fill="(#[0-9A-Fa-f]{6})"/g)].map((match) => match[1].toUpperCase()))]
  if (!background) throw new Error("No Surface_colour fill found")
  return { background: background.toUpperCase(), design }
}

/** Merges the closest design colours until there are at most MAX_ZONES groups. */
function groupColours(design, pixelCounts) {
  let groups = design.map((hex) => ({ colours: [hex], rgb: hexToRgb(hex), weight: pixelCounts.get(hex) ?? 0 }))
  while (groups.length > MAX_ZONES) {
    let best = null
    for (let a = 0; a < groups.length; a++)
      for (let b = a + 1; b < groups.length; b++) {
        const d = distance(groups[a].rgb, groups[b].rgb)
        if (!best || d < best.d) best = { a, b, d }
      }
    const [ga, gb] = [groups[best.a], groups[best.b]]
    const weight = ga.weight + gb.weight || 1
    const merged = { colours: [...ga.colours, ...gb.colours], rgb: ga.rgb.map((v, k) => Math.round((v * (ga.weight || 0.5) + gb.rgb[k] * (gb.weight || 0.5)) / (weight || 1))), weight: ga.weight + gb.weight }
    // The group's colour is its most-used member, so it reads like the artwork.
    const lead = merged.colours.reduce((top, hex) => ((pixelCounts.get(hex) ?? 0) > (pixelCounts.get(top) ?? 0) ? hex : top))
    merged.rgb = hexToRgb(lead)
    groups = groups.filter((_, index) => index !== best.a && index !== best.b).concat(merged)
  }
  // Biggest zone first: it becomes "graphic", the main design shapes.
  return groups.sort((a, b) => b.weight - a.weight)
}


const folders = templates.filter((item) => onlySlugs.length === 0 || onlySlugs.includes(item.slug))
const summary = []
for (const template of folders) {
  const file = path.join(svgRoot, template.folder, `${template.folder}.svg`)
  const source = readFileSync(file, "utf8")
  const { background, design } = svgColours(source)
  const raster = (await sharp(Buffer.from(source), { density: (72 * SIZE) / 2048 }).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data

  // Each covered pixel goes to the nearest exact colour.
  const all = [background, ...design]
  const allRgb = all.map(hexToRgb)
  const owner = new Int8Array(SIZE * SIZE).fill(-1)
  const counts = new Map()
  for (let index = 0; index < SIZE * SIZE; index++) {
    if (raster[index * 4 + 3] < 128) continue
    const rgb = [raster[index * 4], raster[index * 4 + 1], raster[index * 4 + 2]]
    let best = 0
    for (let c = 1; c < allRgb.length; c++) if (distance(rgb, allRgb[c]) < distance(rgb, allRgb[best])) best = c
    owner[index] = best
    counts.set(all[best], (counts.get(all[best]) ?? 0) + 1)
  }

  const groups = groupColours(design, counts)
  const zones = [{ key: "base", colours: [background], rgb: hexToRgb(background) }, ...groups.map((group, index) => ({ key: ZONE_KEYS[index], ...group }))]
  const zoneOfColour = new Map(zones.flatMap((zone, z) => zone.colours.map((hex) => [hex, z])))

  const rgba = growEdges(raster)
  const artwork = Buffer.alloc(SIZE * SIZE * 3)
  for (let index = 0; index < SIZE * SIZE; index++) {
    if (rgba[index * 4 + 3] === 0) continue
    artwork[index * 3] = rgba[index * 4]
    artwork[index * 3 + 1] = rgba[index * 4 + 1]
    artwork[index * 3 + 2] = rgba[index * 4 + 2]
  }
  // Masks reach out into the grown gutter too, from the nearest covered pixel's zone.
  const grownOwner = growOwner(owner)
  const masks = Object.fromEntries(zones.map((zone) => [zone.key, Buffer.alloc(SIZE * SIZE)]))
  for (let index = 0; index < SIZE * SIZE; index++) {
    const c = grownOwner[index]
    if (c === -1) continue
    masks[zones[zoneOfColour.get(all[c])].key][index] = 255
  }

  const out = path.join("public/models/templates/arai-sk6", template.slug)
  await mkdir(out, { recursive: true })
  await sharp(artwork, { raw: { width: SIZE, height: SIZE, channels: 3 } }).webp({ quality: 90, smartSubsample: true }).toFile(path.join(out, "artwork.webp"))
  const shell = [...owner].filter((value) => value !== -1).length
  const zoneInfo = []
  for (const zone of zones) {
    await sharp(masks[zone.key], { raw: { width: SIZE, height: SIZE, channels: 1 } }).resize(MASK_SIZE, MASK_SIZE).png({ compressionLevel: 9 }).toFile(path.join(out, `${zone.key}-mask.png`))
    const covered = zone.colours.reduce((sum, hex) => sum + (counts.get(hex) ?? 0), 0)
    const [swatchName, swatch] = nearestSwatch(zone.rgb)
    zoneInfo.push({ key: zone.key, colours: zone.colours, swatch, swatchName, label: colourName(zone.rgb), coverage: Math.round((covered / shell) * 10000) / 10000 })
  }
  // Racing lines along the borders between the zones (the background counts as a zone).
  await sharp(await racingLines(masks, zones.map((zone) => zone.key), rgba), { raw: { width: MASK_SIZE, height: MASK_SIZE, channels: 1 } }).png({ compressionLevel: 9 }).toFile(path.join(out, "lines-mask.png"))
  await writeFile(path.join(out, "zones.json"), JSON.stringify({ slug: template.slug, name: template.name, zones: zoneInfo }, null, 2))
  summary.push(`${template.slug}: ${zoneInfo.map((z) => `${z.key}=${z.label}(${z.colours.join("+")}) ${(z.coverage * 100).toFixed(1)}%`).join(", ")}`)
  console.log(summary.at(-1))
}

/** Gives each pixel in the grown gutter the zone of the nearest covered pixel. */
function growOwner(owner) {
  let current = owner.slice()
  for (let pass = 0; pass < GUTTER; pass++) {
    const next = current.slice()
    for (let y = 1; y < SIZE - 1; y++) {
      for (let x = 1; x < SIZE - 1; x++) {
        const at = y * SIZE + x
        if (current[at] !== -1) continue
        for (const step of [-1, 1, -SIZE, SIZE]) {
          if (current[at + step] !== -1) {
            next[at] = current[at + step]
            break
          }
        }
      }
    }
    current = next
  }
  return current
}
