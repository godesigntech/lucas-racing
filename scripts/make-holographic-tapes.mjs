// Draws the holographic racing-tape swatches the builder offers for racing lines, into
// public/films/holographic/. Replace them with photos of the real tapes when the client
// sends samples, keeping the same file names.
//
//   node scripts/make-holographic-tapes.mjs

import { mkdir } from "node:fs/promises"

import sharp from "sharp"

const SIZE = 512
const tapes = [
  ["silver", "#d9dde3"],
  ["gold", "#e2b84a"],
  ["blue", "#3f7bff"],
  ["red", "#ff3b3b"],
  ["green", "#2fd36b"],
  ["purple", "#9b5cff"],
  ["pink", "#ff5fc8"],
]

/** A rainbow shift across diagonal bands, tinted towards the tape's colour, like holographic foil. */
function foil(tint) {
  const hues = ["#ff4d6d", "#ffb84d", "#fff36b", "#5dff9e", "#4dd8ff", "#7a6bff", "#ff6bf1", "#ff4d6d"]
  const stops = hues.map((hue, index) => `<stop offset="${(index / (hues.length - 1)).toFixed(3)}" stop-color="${hue}"/>`).join("")
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1" spreadMethod="reflect" gradientTransform="scale(0.35)">${stops}</linearGradient>
    <linearGradient id="sheen" x1="0" y1="1" x2="1" y2="0" spreadMethod="reflect" gradientTransform="scale(0.12)">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#ffffff" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#rainbow)"/>
  <rect width="${SIZE}" height="${SIZE}" fill="${tint}" opacity="0.55"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#sheen)"/>
</svg>`)
}

await mkdir("public/films/holographic/thumbs", { recursive: true })
for (const [name, tint] of tapes) {
  await sharp(foil(tint)).webp({ quality: 88 }).toFile(`public/films/holographic/${name}.webp`)
  await sharp(foil(tint)).resize(160, 160).webp({ quality: 85 }).toFile(`public/films/holographic/thumbs/${name}.webp`)
  console.log(name)
}
