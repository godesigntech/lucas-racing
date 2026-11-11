// Draws the holographic racing-tape swatches the builder offers for racing lines, into
// public/films/holographic/. Replace them with photos of the real tapes when the client
// sends samples, keeping the same file names.
//
//   node scripts/make-holographic-tapes.mjs

import { mkdir } from "node:fs/promises"

import sharp from "sharp"

const SIZE = 512
// [name, the tape's own colour, how strongly it shows over the rainbow]. The client wants
// each tape to read as its colour first (gold more gold, silver more silver), with the
// holographic shimmer on top rather than a rainbow tinted slightly.
const tapes = [
  ["silver", "#c8cdd3", 0.9],
  ["gold", "#dba61c", 0.9],
  ["blue", "#2f6fff", 0.75],
  ["red", "#ef2b2b", 0.75],
  ["green", "#22c25e", 0.75],
  ["purple", "#8a4dff", 0.75],
  ["pink", "#ff4fbf", 0.75],
]

/** A rainbow shift across diagonal bands, tinted towards the tape's colour, like holographic foil. */
function foil(tint, strength) {
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
  <rect width="${SIZE}" height="${SIZE}" fill="${tint}" opacity="${strength}"/>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#sheen)"/>
</svg>`)
}

await mkdir("public/films/holographic/thumbs", { recursive: true })
for (const [name, tint, strength] of tapes) {
  await sharp(foil(tint, strength)).webp({ quality: 88 }).toFile(`public/films/holographic/${name}.webp`)
  await sharp(foil(tint, strength)).resize(160, 160).webp({ quality: 85 }).toFile(`public/films/holographic/thumbs/${name}.webp`)
  console.log(name)
}
