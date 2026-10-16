// One-off: turns the client's original images (assets/client-originals) into web-ready files in public/images.
// Logos get a transparent background (keyed from white, edges kept smooth) and are trimmed;
// photos are resized and saved as WebP. Re-run after the client sends better originals.
//
// Usage: node scripts/prepare-brand-assets.mjs <path to a folder containing node_modules/sharp>

import { createRequire } from "node:module"
import { mkdir } from "node:fs/promises"
import path from "node:path"

const require = createRequire(path.join(process.argv[2] ?? process.cwd(), "package.json"))
const sharp = require("sharp")

const source = path.resolve("assets/client-originals")
const out = path.resolve("public/images")

/** White background → transparency. alpha = how far the darkest channel is from white; colour un-blended from white. */
async function logo(file, name) {
  const { data, info } = await sharp(path.join(source, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2])
    const alpha = Math.min(255, Math.max(0, (255 - min) * 1.15))
    if (alpha < 8) {
      data[i + 3] = 0
      continue
    }
    const a = alpha / 255
    for (let c = 0; c < 3; c += 1) data[i + c] = Math.max(0, Math.min(255, (data[i + c] - (1 - a) * 255) / a))
    data[i + 3] = Math.min(data[i + 3], alpha)
  }
  const target = path.join(out, "brand", `${name}.png`)
  await sharp(data, { raw: info }).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(target)
  const meta = await sharp(target).metadata()
  console.log(`brand/${name}.png ${meta.width}x${meta.height}`)
}

async function photo(file, name, maxSide = 2000) {
  const target = path.join(out, "team", `${name}.webp`)
  await sharp(path.join(source, file))
    .rotate()
    .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(target)
  const meta = await sharp(target).metadata()
  console.log(`team/${name}.webp ${meta.width}x${meta.height}`)
}

await mkdir(path.join(out, "brand"), { recursive: true })
await mkdir(path.join(out, "team"), { recursive: true })

await logo("lucas logo.jpeg", "lucas-racing-logo")
await logo("Lucas by hydro.png", "lucas-racing-by-hydrokarts")
await logo("ms kart.png", "ms-kart-logo")

await photo("team photo.jpg", "team-photo")
await photo("team awning.jpg", "team-awning")
await photo("howard.jpg", "howard")
await photo("conor.jpg", "connor")
await photo("conor coaching.jpg", "connor-coaching")
await photo("wendy.jpg", "wendy")
await photo("father and son.jpg", "father-and-son")
await photo("father and son2.jpg", "father-and-son-paddock")
