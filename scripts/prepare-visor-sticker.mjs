// Turns the client's flat visor sticker artwork into the texture the 3D visor strip uses.
//
//   node scripts/prepare-visor-sticker.mjs [input] [output]
//
// The artwork is drawn as an arch: its top edge dips in the middle so the flat sticker
// lies straight once it's stuck on the curved visor. The website's strip is already
// unrolled flat, so the arch is undone here: every column is moved up until the
// sticker's top edge is a straight line, flush with the top of the strip.
//
// --bottom: for a strip along the visor's bottom edge (the lucasracing.co.uk strip): its
// bottom edge is made straight instead. Done by flipping it, straightening, flipping back.
import sharp from "sharp"

const bottom = process.argv.includes("--bottom")
const [input = "scripts/assets/lucas-racing-visor-sticker.webp", output = "public/stickers/lucas-racing-visor.webp"] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"))

const { data, info } = await sharp(input).flip(bottom).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: w, height: h } = info

// 1. Cut the sticker out: flood fill the near-white background from the border. The
//    sticker's own whites (the checks) are enclosed by its outline, so they stay.
const background = new Uint8Array(w * h)
const isWhite = (i) => data[i * 4] > 225 && data[i * 4 + 1] > 225 && data[i * 4 + 2] > 225
const stack = []
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
while (stack.length) {
  const i = stack.pop()
  if (background[i] || !isWhite(i)) continue
  background[i] = 1
  const x = i % w
  if (x > 0) stack.push(i - 1)
  if (x < w - 1) stack.push(i + 1)
  if (i >= w) stack.push(i - w)
  if (i < w * (h - 1)) stack.push(i + w)
}
for (let i = 0; i < w * h; i++) {
  if (background[i]) data[i * 4 + 3] = 0
  else if ([i - 1, i + 1, i - w, i + w].some((j) => background[j])) data[i * 4 + 3] = 170 // soft edge
}

// 2. The top edge of each column, smoothed so the outline's jaggies don't wobble it.
const top = new Float64Array(w).fill(NaN)
for (let x = 0; x < w; x++) {
  for (let y = 0; y < h; y++) if (data[(y * w + x) * 4 + 3] > 0) { top[x] = y; break }
}
const filled = Array.from(top)
let last = filled.find((value) => !Number.isNaN(value))
for (let x = 0; x < w; x++) {
  if (Number.isNaN(filled[x])) filled[x] = last
  else last = filled[x]
}
// A median first (ignores the outline's specks), then a wide average: the arch is a smooth
// curve, and any wobble left in it would show as a kinked top edge once straightened.
const median = filled.map((_, x) => {
  const window = filled.slice(Math.max(0, x - 25), x + 26).sort((a, b) => a - b)
  return window[window.length >> 1]
})
const smooth = median.map((_, x) => {
  const window = median.slice(Math.max(0, x - 90), x + 91)
  return window.reduce((sum, value) => sum + value, 0) / window.length
})
const highest = Math.min(...smooth)

// 3. Lift every column so the top edge is straight, by fractions of a pixel (blending the
//    two rows either side), so thin outlines stay clean instead of breaking into steps.
const out = Buffer.alloc(w * h * 4)
for (let x = 0; x < w; x++) {
  const shift = smooth[x] - highest
  const whole = Math.floor(shift)
  const part = shift - whole
  for (let y = 0; y < h; y++) {
    const a = y + whole
    const b = a + 1
    if (a >= h) break
    for (let channel = 0; channel < 4; channel++) {
      const top = data[(a * w + x) * 4 + channel]
      const bottom = b < h ? data[(b * w + x) * 4 + channel] : 0
      out[(y * w + x) * 4 + channel] = Math.round(top * (1 - part) + bottom * part)
    }
  }
}

// Near-invisible specks (anti-aliasing left in some exports) would stop the trim, leaving
// empty space that shrinks the sticker on the visor.
for (let i = 3; i < out.length; i += 4) if (out[i] < 12) out[i - 3] = out[i - 2] = out[i - 1] = out[i] = 0
// Trimmed first (to a buffer), then flipped back: sharp runs trim after flip in one chain.
const trimmed = await sharp(out, { raw: { width: w, height: h, channels: 4 } }).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 }).png().toBuffer()
const result = await sharp(trimmed).flip(bottom).webp({ quality: 92, alphaQuality: 100 }).toFile(output)
console.log(`${output}: ${result.width} x ${result.height}, arch of ${Math.round(Math.max(...smooth) - highest)}px straightened`)
