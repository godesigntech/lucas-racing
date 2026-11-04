// Template masks are cut against one model's UVs, so a new helmet model needs them re-cut.
// This keeps each design where it is on the helmet: every texel of the new shell finds its
// matching point on the old shell, and takes the old mask's value there. Masks with no
// source (a brand new template) still have to come from the artist.
//
//   node scripts/retarget-template-masks.mjs <old.glb> <old masks dir> <new.glb> <output dir>
//
// <old.glb> and <new.glb> must be uncompressed (the artist's files, not the website's).

import { readdir, mkdir } from "node:fs/promises"
import path from "node:path"

import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import sharp from "sharp"
import { BufferAttribute, BufferGeometry, Matrix4, Triangle, Vector3 } from "three"
import { MeshBVH } from "three-mesh-bvh"

const [oldModel, oldMasks, newModel, outDir] = process.argv.slice(2)
if (!outDir) throw new Error("Usage: node scripts/retarget-template-masks.mjs <old.glb> <old masks dir> <new.glb> <output dir>")

const SIZE = 2048
const MASKS = ["graphic-mask.png", "accent-mask.png"]
/** How far each UV island is grown, so filtering at its edge never picks up black. */
const GUTTER = 8

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

/** A mesh's triangles in helmet space, with their UVs. */
async function readShell(file, names) {
  const root = (await io.read(file)).getRoot()
  const node = root.listNodes().find((item) => names.includes(item.getName()))
  if (!node) throw new Error(`${file} has no shell called ${names.join(" or ")}.`)
  const primitive = node.getMesh().listPrimitives()[0]
  const matrix = new Matrix4().fromArray(node.getWorldMatrix())
  const positions = new Float32Array(primitive.getAttribute("POSITION").getArray())
  const point = new Vector3()
  for (let index = 0; index < positions.length; index += 3) {
    point.fromArray(positions, index).applyMatrix4(matrix).toArray(positions, index)
  }
  const uvs = primitive.getAttribute("TEXCOORD_0").getArray()
  const indices = new Uint32Array(primitive.getIndices().getArray())
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(positions, 3))
  geometry.setIndex(new BufferAttribute(indices, 1))
  geometry.computeBoundingBox()
  return { geometry, positions, uvs, indices, box: geometry.boundingBox }
}

const previous = await readShell(oldModel, ["Shell"])
const next = await readShell(newModel, ["helmet shell", "Shell"])
const bvh = new MeshBVH(previous.geometry)

const scale = previous.box.getSize(new Vector3()).divide(next.box.getSize(new Vector3()))
const toPrevious = (point) => point.sub(next.box.min).multiply(scale).add(previous.box.min)

/** For each texel of the new mask, the old mask's UV to read. -1 where the shell has no UVs. */
const lookup = new Float32Array(SIZE * SIZE * 2).fill(-1)
const triangle = new Triangle()
const barycentric = new Vector3()
const a = new Vector3()
const b = new Vector3()
const c = new Vector3()
const hit = {}

function matchingUv(point) {
  bvh.closestPointToPoint(point, hit)
  const face = hit.faceIndex
  const [i0, i1, i2] = [previous.indices[face * 3], previous.indices[face * 3 + 1], previous.indices[face * 3 + 2]]
  triangle.set(a.fromArray(previous.positions, i0 * 3), b.fromArray(previous.positions, i1 * 3), c.fromArray(previous.positions, i2 * 3))
  triangle.getBarycoord(hit.point, barycentric)
  const { x, y, z } = barycentric
  return [
    previous.uvs[i0 * 2] * x + previous.uvs[i1 * 2] * y + previous.uvs[i2 * 2] * z,
    previous.uvs[i0 * 2 + 1] * x + previous.uvs[i1 * 2 + 1] * y + previous.uvs[i2 * 2 + 1] * z,
  ]
}

console.log("Matching the new shell to the old one…")
const started = Date.now()
const point = new Vector3()
for (let face = 0; face < next.indices.length / 3; face++) {
  const [i0, i1, i2] = [next.indices[face * 3], next.indices[face * 3 + 1], next.indices[face * 3 + 2]]
  const [ax, ay] = [next.uvs[i0 * 2] * SIZE, next.uvs[i0 * 2 + 1] * SIZE]
  const [bx, by] = [next.uvs[i1 * 2] * SIZE, next.uvs[i1 * 2 + 1] * SIZE]
  const [cx, cy] = [next.uvs[i2 * 2] * SIZE, next.uvs[i2 * 2 + 1] * SIZE]
  const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
  if (Math.abs(area) < 1e-9) continue
  const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)))
  const maxX = Math.min(SIZE - 1, Math.ceil(Math.max(ax, bx, cx)))
  const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)))
  const maxY = Math.min(SIZE - 1, Math.ceil(Math.max(ay, by, cy)))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5
      const py = y + 0.5
      const w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area
      const w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area
      const w2 = 1 - w0 - w1
      if (w0 < 0 || w1 < 0 || w2 < 0) continue
      point.set(
        next.positions[i0 * 3] * w0 + next.positions[i1 * 3] * w1 + next.positions[i2 * 3] * w2,
        next.positions[i0 * 3 + 1] * w0 + next.positions[i1 * 3 + 1] * w1 + next.positions[i2 * 3 + 1] * w2,
        next.positions[i0 * 3 + 2] * w0 + next.positions[i1 * 3 + 2] * w1 + next.positions[i2 * 3 + 2] * w2,
      )
      const [u, v] = matchingUv(toPrevious(point))
      lookup[(y * SIZE + x) * 2] = u
      lookup[(y * SIZE + x) * 2 + 1] = v
    }
  }
}
console.log(`Matched in ${Math.round((Date.now() - started) / 1000)}s.`)

// Grow the islands outwards by copying each empty texel's nearest filled neighbour.
for (let pass = 0; pass < GUTTER; pass++) {
  const grown = lookup.slice()
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const at = (y * SIZE + x) * 2
      if (lookup[at] !== -1) continue
      for (const step of [-2, 2, -SIZE * 2, SIZE * 2]) {
        if (lookup[at + step] !== -1) {
          grown[at] = lookup[at + step]
          grown[at + 1] = lookup[at + step + 1]
          break
        }
      }
    }
  }
  lookup.set(grown)
}

/** Bilinear read of a greyscale mask at a UV. */
function sample(pixels, width, height, u, v) {
  const x = Math.min(Math.max(u * width - 0.5, 0), width - 1.001)
  const y = Math.min(Math.max(v * height - 0.5, 0), height - 1.001)
  const [x0, y0] = [Math.floor(x), Math.floor(y)]
  const [fx, fy] = [x - x0, y - y0]
  const top = pixels[y0 * width + x0] * (1 - fx) + pixels[y0 * width + x0 + 1] * fx
  const bottom = pixels[(y0 + 1) * width + x0] * (1 - fx) + pixels[(y0 + 1) * width + x0 + 1] * fx
  return top * (1 - fy) + bottom * fy
}

for (const template of await readdir(oldMasks)) {
  for (const mask of MASKS) {
    const input = sharp(path.join(oldMasks, template, mask)).extractChannel(0)
    const { data, info } = await input.raw().toBuffer({ resolveWithObject: true }).catch(() => ({}))
    if (!data) continue
    const output = Buffer.alloc(SIZE * SIZE)
    for (let index = 0; index < SIZE * SIZE; index++) {
      if (lookup[index * 2] === -1) continue
      output[index] = Math.round(sample(data, info.width, info.height, lookup[index * 2], lookup[index * 2 + 1]))
    }
    await mkdir(path.join(outDir, template), { recursive: true })
    await sharp(output, { raw: { width: SIZE, height: SIZE, channels: 1 } }).png({ compressionLevel: 9, palette: false }).toFile(path.join(outDir, template, mask))
    console.log(`  ${template}/${mask}`)
  }
}
