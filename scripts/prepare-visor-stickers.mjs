// Turns the designer's visor sticker SVGs into ones the builder can recolour: every
// colour becomes a part (a CSS class the builder rewrites), near-identical shades are
// merged, and the thin cut outline stays as drawn. Writes the SVGs to
// public/stickers/designs/ and their list to src/lib/helmet-3d/visor-sticker-designs.json.
//
//   node scripts/prepare-visor-stickers.mjs "D:/downloads/.../Editable SVG"

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [source] = process.argv.slice(2)
if (!source) throw new Error("Usage: node scripts/prepare-visor-stickers.mjs <folder of SVGs>")

const outDir = "public/stickers/designs"
const listFile = "src/lib/helmet-3d/visor-sticker-designs.json"
mkdirSync(outDir, { recursive: true })

const hexToRgb = (hex) => {
  const value = hex.length === 4 ? hex.slice(1).split("").map((c) => c + c).join("") : hex.slice(1)
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))
}
const distance = (a, b) => Math.hypot(...hexToRgb(a).map((v, i) => v - hexToRgb(b)[i]))

/** A plain name for a colour, for the colour pickers ("Purple", "Light blue"). */
function colourName(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const s = max === 0 ? 0 : (max - min) / max
  const v = max
  if (s < 0.15) return v < 0.2 ? "Black" : v < 0.45 ? "Dark grey" : v < 0.8 ? "Grey" : "White"
  let h = 0
  if (max === r) h = ((g - b) / (max - min)) % 6
  else if (max === g) h = (b - r) / (max - min) + 2
  else h = (r - g) / (max - min) + 4
  h = (h * 60 + 360) % 360
  const hue = h < 15 || h >= 345 ? "Red" : h < 40 ? "Orange" : h < 68 ? "Yellow" : h < 90 ? "Lime" : h < 165 ? "Green" : h < 195 ? "Teal" : h < 250 ? "Blue" : h < 290 ? "Purple" : "Pink"
  if (hue === "Orange" && v < 0.6) return v < 0.35 ? "Dark brown" : "Brown"
  if (s < 0.3 && v > 0.8) return "Cream"
  if (v < 0.4) return `Dark ${hue.toLowerCase()}`
  if (s < 0.45 && v > 0.8) return `Light ${hue.toLowerCase()}`
  return hue
}

const titleCase = (slug) => slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")

const designs = []
for (const file of readdirSync(source).filter((name) => name.endsWith(".svg")).sort()) {
  let svg = readFileSync(path.join(source, file), "utf8")
  const slug = file.replace(/\.svg$/, "").replace(/^\d+-/, "")

  // The cut outline is the sticker's edge: it keeps its own colour.
  const outline = new Set([...svg.matchAll(/stroke="(#[0-9a-fA-F]{3,6})"[^>]*data-layer="outline"/g)].map((m) => m[1].toLowerCase()))
  // The main band's first fill is the sticker's background.
  const background = svg.match(/data-part="main-band"[^>]*>\s*<path[^>]*fill="(#[0-9a-fA-F]{3,6})"/)?.[1].toLowerCase()

  // Every colour used, most area-ish (most uses) first, merged when near-identical.
  const uses = new Map()
  for (const m of svg.matchAll(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g)) {
    const colour = m[2].toLowerCase()
    if (m[1] === "stroke" && outline.has(colour)) continue
    uses.set(colour, (uses.get(colour) ?? 0) + 1)
  }
  const ordered = [...uses.keys()].sort((a, b) => (a === background ? -1 : b === background ? 1 : uses.get(b) - uses.get(a)))
  const groups = []
  for (const colour of ordered) {
    const group = groups.find((item) => distance(item.colour, colour) < 20)
    if (group) group.members.push(colour)
    else groups.push({ colour, members: [colour] })
  }

  const parts = groups.map((group, index) => ({ key: `s${index}`, colour: group.colour, members: group.members }))
  const classOf = (colour) => parts.find((part) => part.members.includes(colour))?.key
  svg = svg.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g, (match, kind, hex) => {
    const key = classOf(hex.toLowerCase())
    if (!key) return match
    return kind === "fill" ? `class="${key}"` : `class="${key}-st"`
  })
  // Elements that now carry two class attributes (fill and stroke) get them merged.
  svg = svg.replace(/class="([^"]+)"([^>]*?)\sclass="([^"]+)"/g, 'class="$1 $3"$2')
  const style = parts.map((part) => `.${part.key} {fill:${part.colour}} .${part.key}-st {stroke:${part.colour}}`).join(" ")
  svg = svg.replace(/(<svg[^>]*>)/, `$1<style>${style}</style>`)
  writeFileSync(path.join(outDir, `${slug}.svg`), svg)

  // Names for the colour pickers: the background, then each colour by name.
  const used = new Map()
  designs.push({
    id: slug,
    name: titleCase(slug),
    file: `/stickers/designs/${slug}.svg?v=1`,
    shaped: true,
    parts: parts.map((part) => {
      let label = part.colour === background ? "Background" : colourName(part.colour)
      const count = (used.get(label) ?? 0) + 1
      used.set(label, count)
      if (count > 1) label = `${label} ${count}`
      return { key: part.key, label, colour: part.colour }
    }),
  })
}

writeFileSync(listFile, JSON.stringify(designs, null, 2) + "\n")
console.log(`Wrote ${designs.length} designs to ${outDir} and ${listFile}`)
for (const design of designs) console.log(`  ${design.name}: ${design.parts.map((part) => `${part.label} ${part.colour}`).join(", ")}`)
