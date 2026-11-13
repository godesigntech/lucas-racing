// Moves the Bell KC7 template artwork onto the Arai SK-6, so every design works on both
// helmets. Each point of the SK-6 shell is matched to the same spot on the Bell's shell
// (both shells scaled to the same box), and takes the artwork and zone masks from there.
// Writes public/models/templates/arai-sk6/<slug>/ with the same files as the Bell.
//
//   node scripts/prepare-sk6-templates.mjs [slug ...]
//
// Run after scripts/prepare-arai-sk6.mjs and whenever a Bell template changes.

import { existsSync } from "node:fs"
import { mkdir, readdir } from "node:fs/promises"
import path from "node:path"

import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { MeshoptDecoder } from "meshoptimizer"
import sharp from "sharp"

const SIZE = 4096
const MASK_SIZE = 2048
/** How far past the shell's edge the artwork is carried, so seams never show black. */
const GUTTER = 24
/** Corners of one SK-6 triangle take their UVs from one island of the Bell's texture. */
const UV_NEIGHBOURHOOD = 0.05
const FROM = "public/models/templates/bell-kc7"
const TO = "public/models/templates/arai-sk6"

await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder })

const transform = (m, [x, y, z]) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]

/** The shell's triangles in a box from -1 to 1 on every axis, with their UVs. */
async function shellTriangles(file) {
  const document = await io.read(file)
  const node = document.getRoot().listNodes().find((item) => item.getName() === "Shell")
  const matrix = node.getWorldMatrix()
  const raw = []
  for (const primitive of node.getMesh().listPrimitives()) {
    const position = primitive.getAttribute("POSITION")
    const uv = primitive.getAttribute("TEXCOORD_0")
    const indices = primitive.getIndices()
    for (let t = 0; t < indices.getCount() / 3; t++) {
      const corners = [0, 1, 2].map((c) => indices.getScalar(t * 3 + c))
      raw.push({ points: corners.map((i) => transform(matrix, position.getElement(i, []))), uvs: corners.map((i) => uv.getElement(i, [])) })
    }
  }
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const { points } of raw) for (const p of points) for (let k = 0; k < 3; k++) [min[k], max[k]] = [Math.min(min[k], p[k]), Math.max(max[k], p[k])]
  const centre = min.map((value, k) => (value + max[k]) / 2)
  const half = min.map((value, k) => (max[k] - value) / 2)
  for (const triangle of raw) {
    triangle.points = triangle.points.map((p) => p.map((value, k) => (value - centre[k]) / half[k]))
    triangle.centre = [0, 1, 2].map((k) => (triangle.points[0][k] + triangle.points[1][k] + triangle.points[2][k]) / 3)
    triangle.uvCentre = [0, 1].map((k) => (triangle.uvs[0][k] + triangle.uvs[1][k] + triangle.uvs[2][k]) / 3)
  }
  return raw
}

/** Closest point on triangle abc to p, as barycentric weights (Ericson). */
function closestWeights(p, [a, b, c]) {
  const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]]
  const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2]
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a)
  const d1 = dot(ab, ap), d2 = dot(ac, ap)
  if (d1 <= 0 && d2 <= 0) return [1, 0, 0]
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp)
  if (d3 >= 0 && d4 <= d3) return [0, 1, 0]
  const vc = d1 * d4 - d3 * d2
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [1 - v, v, 0] }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp)
  if (d6 >= 0 && d5 <= d6) return [0, 0, 1]
  const vb = d5 * d2 - d1 * d6
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [1 - w, 0, w] }
  const va = d3 * d6 - d5 * d4
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + (d5 - d6)); return [0, 1 - w, w] }
  const denom = 1 / (va + vb + vc)
  const v = vb * denom, w = vc * denom
  return [1 - v - w, v, w]
}

/** A grid over the Bell's triangles, so each lookup only checks the ones nearby. */
const CELLS = 32
const cellOf = (value) => Math.min(CELLS - 1, Math.max(0, Math.floor(((value + 1) / 2) * CELLS)))
function buildGrid(triangles) {
  const grid = new Map()
  for (const triangle of triangles) {
    const key = triangle.centre.map(cellOf).join(",")
    if (!grid.has(key)) grid.set(key, [])
    grid.get(key).push(triangle)
  }
  return grid
}
function nearby(grid, point, radius) {
  const [cx, cy, cz] = point.map(cellOf)
  const found = []
  for (let x = cx - radius; x <= cx + radius; x++)
    for (let y = cy - radius; y <= cy + radius; y++)
      for (let z = cz - radius; z <= cz + radius; z++) found.push(...(grid.get(`${x},${y},${z}`) ?? []))
  return found
}
function nearest(point, candidates) {
  let best = null
  let bestDistance = Infinity
  for (const triangle of candidates) {
    const w = closestWeights(point, triangle.points)
    const q = [0, 1, 2].map((k) => w[0] * triangle.points[0][k] + w[1] * triangle.points[1][k] + w[2] * triangle.points[2][k])
    const distance = (q[0] - point[0]) ** 2 + (q[1] - point[1]) ** 2 + (q[2] - point[2]) ** 2
    if (distance < bestDistance) [best, bestDistance] = [{ triangle, weights: w }, distance]
  }
  return best
}
function search(grid, point, filter = () => true) {
  for (let radius = 1; radius <= CELLS; radius++) {
    const hit = nearest(point, nearby(grid, point, radius).filter(filter))
    if (hit) return hit
  }
  return null
}

console.log("Matching the SK-6 shell to the Bell KC7 shell…")
const bell = await shellTriangles("public/models/bell-kc7.glb")
const arai = await shellTriangles("public/models/arai-sk6.glb")
const grid = buildGrid(bell)

// Where on the Bell's texture each SK-6 texel comes from.
const remapU = new Float32Array(SIZE * SIZE)
const remapV = new Float32Array(SIZE * SIZE)
const covered = new Uint8Array(SIZE * SIZE)
for (const triangle of arai) {
  const { triangle: home } = search(grid, triangle.centre)
  const [cu, cv] = home.uvCentre
  const sameIsland = (item) => Math.abs(item.uvCentre[0] - cu) < UV_NEIGHBOURHOOD && Math.abs(item.uvCentre[1] - cv) < UV_NEIGHBOURHOOD
  const source = triangle.points.map((point) => {
    const hit = search(grid, point, sameIsland) ?? search(grid, point)
    const { triangle: t, weights: w } = hit
    return [0, 1].map((k) => w[0] * t.uvs[0][k] + w[1] * t.uvs[1][k] + w[2] * t.uvs[2][k])
  })
  // Fill the triangle on the SK-6 texture, blending the three source UVs.
  const xs = triangle.uvs.map((uv) => uv[0] * SIZE - 0.5)
  const ys = triangle.uvs.map((uv) => uv[1] * SIZE - 0.5)
  const area = (xs[1] - xs[0]) * (ys[2] - ys[0]) - (xs[2] - xs[0]) * (ys[1] - ys[0])
  if (Math.abs(area) < 1e-9) continue
  const x0 = Math.max(0, Math.floor(Math.min(...xs)))
  const x1 = Math.min(SIZE - 1, Math.ceil(Math.max(...xs)))
  const y0 = Math.max(0, Math.floor(Math.min(...ys)))
  const y1 = Math.min(SIZE - 1, Math.ceil(Math.max(...ys)))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const w0 = ((xs[1] - x) * (ys[2] - y) - (xs[2] - x) * (ys[1] - y)) / area
      const w1 = ((xs[2] - x) * (ys[0] - y) - (xs[0] - x) * (ys[2] - y)) / area
      const w2 = 1 - w0 - w1
      if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue
      const index = y * SIZE + x
      remapU[index] = w0 * source[0][0] + w1 * source[1][0] + w2 * source[2][0]
      remapV[index] = w0 * source[0][1] + w1 * source[1][1] + w2 * source[2][1]
      covered[index] = 1
    }
  }
}

// Carry the mapping a little past the shell's edge, so filtering never picks up black.
{
  let frontier = covered.slice()
  for (let pass = 0; pass < GUTTER; pass++) {
    const next = frontier.slice()
    for (let y = 1; y < SIZE - 1; y++) {
      for (let x = 1; x < SIZE - 1; x++) {
        const index = y * SIZE + x
        if (frontier[index]) continue
        for (const step of [-1, 1, -SIZE, SIZE]) {
          if (frontier[index + step]) {
            remapU[index] = remapU[index + step]
            remapV[index] = remapV[index + step]
            next[index] = 1
            break
          }
        }
      }
    }
    frontier = next
  }
  covered.set(frontier)
}
console.log("Mapping ready.")

/** Bilinear sample of an image at a UV (0–1, v down as in glTF). */
function sample(data, width, channels, u, v, out, offset) {
  const x = Math.min(width - 1.001, Math.max(0, u * width - 0.5))
  const y = Math.min(width - 1.001, Math.max(0, v * width - 0.5))
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  for (let c = 0; c < channels; c++) {
    const a = data[(iy * width + ix) * channels + c]
    const b = data[(iy * width + ix + 1) * channels + c]
    const d = data[((iy + 1) * width + ix) * channels + c]
    const e = data[((iy + 1) * width + ix + 1) * channels + c]
    out[offset + c] = Math.round((a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy)
  }
}

const only = process.argv.slice(2)
const slugs = (await readdir(FROM)).filter((slug) => only.length === 0 || only.includes(slug))
for (const slug of slugs) {
  const from = path.join(FROM, slug)
  const to = path.join(TO, slug)
  await mkdir(to, { recursive: true })

  const art = await sharp(path.join(from, "artwork.webp")).removeAlpha().resize(SIZE, SIZE).raw().toBuffer()
  const out = Buffer.alloc(SIZE * SIZE * 3)
  for (let index = 0; index < SIZE * SIZE; index++) if (covered[index]) sample(art, SIZE, 3, remapU[index], remapV[index], out, index * 3)
  await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 3 } }).webp({ quality: 90, smartSubsample: true }).toFile(path.join(to, "artwork.webp"))

  const shares = []
  for (const file of (await readdir(from)).filter((name) => name.endsWith("-mask.png"))) {
    const mask = await sharp(path.join(from, file)).extractChannel(0).resize(MASK_SIZE, MASK_SIZE).raw().toBuffer()
    const result = Buffer.alloc(MASK_SIZE * MASK_SIZE)
    let on = 0
    let inside = 0
    for (let y = 0; y < MASK_SIZE; y++) {
      for (let x = 0; x < MASK_SIZE; x++) {
        const index = (y * 2) * SIZE + x * 2
        if (!covered[index]) continue
        sample(mask, MASK_SIZE, 1, remapU[index], remapV[index], result, y * MASK_SIZE + x)
        inside++
        if (result[y * MASK_SIZE + x] > 127) on++
      }
    }
    await sharp(result, { raw: { width: MASK_SIZE, height: MASK_SIZE, channels: 1 } }).png({ compressionLevel: 9 }).toFile(path.join(to, file))
    shares.push(`${file.replace("-mask.png", "")} ${((on / Math.max(1, inside)) * 100).toFixed(1)}%`)
  }
  if (!existsSync(path.join(to, "thumbnail.png"))) await sharp(path.join(from, "thumbnail.png")).toFile(path.join(to, "thumbnail.png"))
  console.log(`${slug}: ${shares.join(", ")}`)
}
