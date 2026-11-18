// Cuts a helmet photo out of its plain studio backdrop for the site's helmet cut-outs
// (public/images/helmets). The backdrop is a smooth light-grey gradient with a soft
// shadow, so it's traced from the edges inwards, step by step, only through pixels that
// are greyish and barely change from their neighbour: the helmet's edge stops it, even
// where the helmet is white.
//
//   node scripts/prepare-helmet-photo.mjs <photo> <output.webp> [width]

import sharp from "sharp"

const [input, output, widthArg = "900"] = process.argv.slice(2)
if (!input || !output) throw new Error("Usage: node scripts/prepare-helmet-photo.mjs <photo> <output.webp> [width]")

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info
const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]
// The backdrop is light grey (about 210 to 238); a white shell is brighter, so it never matches.
const greyish = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) < 14 && (r + g + b) / 3 > 120 && (r + g + b) / 3 < 241
const close = (a, b) => Math.abs(a[0] - b[0]) < 4 && Math.abs(a[1] - b[1]) < 4 && Math.abs(a[2] - b[2]) < 4

const background = new Uint8Array(w * h)
const stack = []
const seed = (i) => {
  if (!background[i] && greyish(px(i))) {
    background[i] = 1
    stack.push(i)
  }
}
for (let x = 0; x < w; x++) {
  seed(x)
  seed((h - 1) * w + x)
}
for (let y = 0; y < h; y++) {
  seed(y * w)
  seed(y * w + w - 1)
}
while (stack.length) {
  const i = stack.pop()
  const here = px(i)
  const x = i % w
  for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < w * (h - 1) ? i + w : -1]) {
    if (j < 0 || background[j]) continue
    const there = px(j)
    if (greyish(there) && close(here, there)) {
      background[j] = 1
      stack.push(j)
    }
  }
}

// Only the helmet itself: the largest solid piece. Specks of shadow or dust left on the
// backdrop are dropped.
const piece = new Int32Array(w * h).fill(-1)
let biggest = -1
let biggestSize = 0
for (let start = 0, id = 0; start < w * h; start++) {
  if (background[start] || piece[start] >= 0) continue
  let size = 0
  const queue = [start]
  piece[start] = id
  while (queue.length) {
    const i = queue.pop()
    size++
    const x = i % w
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i < w * (h - 1) ? i + w : -1]) {
      if (j >= 0 && !background[j] && piece[j] < 0) {
        piece[j] = id
        queue.push(j)
      }
    }
  }
  if (size > biggestSize) [biggest, biggestSize] = [id, size]
  id++
}
for (let i = 0; i < w * h; i++) if (!background[i] && piece[i] !== biggest) background[i] = 1

// Clear the backdrop, with a one-pixel soft edge so the outline isn't jagged.
for (let i = 0; i < w * h; i++) {
  if (background[i]) data[i * 4 + 3] = 0
  else {
    const x = i % w
    const edge = (x > 0 && background[i - 1]) || (x < w - 1 && background[i + 1]) || (i >= w && background[i - w]) || (i < w * (h - 1) && background[i + w])
    if (edge) data[i * 4 + 3] = 150
  }
}

const cut = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 }).png().toBuffer()
const result = await sharp(cut).resize({ width: Number(widthArg), withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 90 }).toFile(output)
console.log(`${output}: ${result.width} x ${result.height}`)
