// Prepares the sample MS Kart parts for the live 2D preview: each photo is resized to
// public/images/kart-parts/samples/<slug>.webp and its finish mask to <slug>-mask.png
// (white, opaque where the finish goes). Bare-metal areas (a steel shaft, a bearing,
// wheel studs) are cut out of the mask by hand below.
//
// Usage: node scripts/prepare-kart-parts.mjs <folder with the source photos> [--check <out folder>]
// --check also writes test renders (paint, film, chrome) to look over.

import { mkdirSync } from "node:fs"
import path from "node:path"
import sharp from "sharp"

import { buildSurface, filmTileSize, findPartMask, renderFinish } from "../src/lib/part-preview/surface.ts"

const MAX_SIDE = 1200
const OUT = path.resolve("public/images/kart-parts/samples")

/** Source file, and areas to leave bare as fractions of the photo: rect [x0, y0, x1, y1] or circle [cx, cy, r of width]. */
const samples = [
  { slug: "stub-axle", file: "104.png", rects: [[0, 0.405, 0.3, 1]], circles: [[0.158, 0.09, 0.088]] },
  { slug: "brake-pedal", file: "101.png" },
  { slug: "sprocket-carrier", file: "113.webp" },
  { slug: "wheel-hub", file: "107.webp", rects: [[0.17, 0.775, 0.31, 1], [0.78, 0.74, 0.91, 1]] },
  { slug: "brake-caliper", file: "108.png" },
]

const [source, flag, checkDir] = process.argv.slice(2)
if (!source) {
  console.error("Usage: node scripts/prepare-kart-parts.mjs <source folder> [--check <out folder>]")
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

for (const sample of samples) {
  const image = sharp(path.join(source, sample.file)).resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true }).removeAlpha().ensureAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const pixels = { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width, height }
  const mask = findPartMask(pixels)

  for (const [x0, y0, x1, y1] of sample.rects ?? []) {
    for (let y = Math.floor(y0 * height); y < Math.min(height, Math.ceil(y1 * height)); y += 1)
      for (let x = Math.floor(x0 * width); x < Math.min(width, Math.ceil(x1 * width)); x += 1) mask[y * width + x] = 0
  }
  for (const [cx, cy, r] of sample.circles ?? []) {
    const radius = r * width
    for (let y = 0; y < height; y += 1)
      for (let x = 0; x < width; x += 1) if (Math.hypot(x - cx * width, y - cy * height) <= radius) mask[y * width + x] = 0
  }

  await sharp(data, { raw: { width, height, channels: 4 } }).removeAlpha().webp({ quality: 88 }).toFile(path.join(OUT, `${sample.slug}.webp`))
  const maskRgba = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    maskRgba[i * 4] = maskRgba[i * 4 + 1] = maskRgba[i * 4 + 2] = 255
    maskRgba[i * 4 + 3] = mask[i]
  }
  await sharp(maskRgba, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, `${sample.slug}-mask.png`))
  console.log(sample.slug, width, height)

  if (flag === "--check" && checkDir) {
    mkdirSync(checkDir, { recursive: true })
    const surface = buildSurface(pixels, mask)
    const size = filmTileSize(surface, 1)
    const tileRaw = await sharp(path.join(source, "111.webp")).resize(size, size, { fit: "cover" }).ensureAlpha().raw().toBuffer()
    const tile = { data: new Uint8ClampedArray(tileRaw.buffer, tileRaw.byteOffset, tileRaw.length), width: size, height: size }
    const renders = [
      ["paint", renderFinish(surface, { kind: "paint", colour: [200, 30, 40] }, "gloss", 0.3)],
      ["film", renderFinish(surface, { kind: "film", tile }, "gloss", 0.3)],
      ["chrome", renderFinish(surface, { kind: "chrome" }, "", 0.3)],
    ]
    for (const [name, out] of renders) {
      await sharp(Buffer.from(out.buffer), { raw: { width, height, channels: 4 } }).resize(500, 500, { fit: "inside" }).png().toFile(path.join(checkDir, `${sample.slug}-${name}.png`))
    }
  }
}
