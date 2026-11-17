// Traces a thin band along the bottom edge of a helmet's visor, where the Lucas Racing
// sticker's lucasracing.co.uk strip goes, and saves it beside the model as JSON (points in
// the model's own scene space). The builder adds it to the helmet as "VisorStripLower".
//
//   node scripts/prepare-visor-lower-band.mjs public/models/bell-kc7.glb public/models/bell-kc7-visor-lower.json
//
// The band starts where the visor first shows above the rubber trim (looking in from
// outside), runs round the eye opening and is a little over a third as deep as the top
// band, so the strip prints at the client's proportion (53.6% of the top sticker's width).

import { writeFileSync } from "node:fs"

import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import { MeshoptDecoder } from "meshoptimizer"
import { Box3, BufferGeometry, DoubleSide, Matrix4, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three"

const [source, target] = process.argv.slice(2)
if (!source || !target) throw new Error("Usage: node scripts/prepare-visor-lower-band.mjs <model.glb> <output.json>")

await MeshoptDecoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder })
const document = await io.read(source)
const nodes = document.getRoot().listNodes()
const findNode = (name) => {
  const node = nodes.find((item) => item.getName() === name)
  if (!node) throw new Error(`${source} has no part called "${name}".`)
  return node
}

/** A part's points in scene space, and a mesh of it to cast rays at. */
function part(name) {
  const node = findNode(name)
  const matrix = new Matrix4().fromArray(node.getWorldMatrix())
  const points = []
  const indices = []
  for (const primitive of node.getMesh().listPrimitives()) {
    const position = primitive.getAttribute("POSITION")
    const offset = points.length
    for (let index = 0; index < position.getCount(); index++) points.push(new Vector3().fromArray(position.getElement(index, [])).applyMatrix4(matrix))
    const list = primitive.getIndices()?.getArray() ?? Array.from({ length: position.getCount() }, (_, index) => index)
    for (const index of list) indices.push(index + offset)
  }
  const geometry = new BufferGeometry().setFromPoints(points)
  geometry.setIndex(indices)
  return { points, mesh: new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide })) }
}

const visor = part("Visor")
const shell = part("Shell")
const cover = [shell.mesh, part("RubberEyeport").mesh]
const top = part("VisorStrip")

const visorBox = new Box3().setFromPoints(visor.points)
const shellBox = new Box3().setFromPoints(shell.points)
const axis = shellBox.getCenter(new Vector3())
const outside = shellBox.getSize(new Vector3()).length()
const raycaster = new Raycaster()

/** The first thing seen looking in from outside at this angle and height, if it's the visor. */
function visorSeen(angle, y) {
  const outward = new Vector3(Math.sin(angle), 0, Math.cos(angle))
  raycaster.set(new Vector3(axis.x, y, axis.z).addScaledVector(outward, outside), outward.clone().negate())
  const [first] = raycaster.intersectObjects([visor.mesh, ...cover], false)
  return first?.object === visor.mesh ? first : null
}

/** The bottom of the visible visor at this angle, or null where none shows. */
function bottomAt(angle) {
  const step = (visorBox.max.y - visorBox.min.y) / 300
  let y = visorBox.min.y
  while (y < visorBox.max.y && !visorSeen(angle, y)) y += step
  if (y >= visorBox.max.y) return null
  let [low, high] = [y - step, y]
  for (let k = 0; k < 14; k++) {
    const middle = (low + high) / 2
    if (visorSeen(angle, middle)) high = middle
    else low = middle
  }
  return high
}

// How deep the top band is at the front: the strip is a little over a third of that.
const topBox = new Box3().setFromPoints(top.points)
const front = top.points.filter((point) => Math.abs(point.x - axis.x) < (topBox.max.x - topBox.min.x) * 0.04)
const topDepth = Math.max(...front.map((point) => point.y)) - Math.min(...front.map((point) => point.y))
const depth = topDepth * 0.38

const REACH = (70 * Math.PI) / 180
const COLUMNS = 140
const ROWS = 6
const height = visorBox.max.y - visorBox.min.y
// Clear of the trim and chin bar, which sit in front of the visor's bottom edge when seen from above.
const inset = height * 0.045
const proud = (visorBox.max.x - visorBox.min.x) * 0.0015

const columns = []
for (let column = 0; column <= COLUMNS; column++) {
  const angle = -REACH + (2 * REACH * column) / COLUMNS
  const bottom = bottomAt(angle)
  if (bottom === null) continue
  const row = []
  for (let step = 0; step <= ROWS; step++) {
    const hit = visorSeen(angle, bottom + inset + (depth * step) / ROWS)
    if (!hit) break
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    if (normal.dot(new Vector3(Math.sin(angle), 0, Math.cos(angle))) < 0) normal.negate()
    row.push(hit.point.clone().addScaledVector(normal, proud))
  }
  // Only whole columns: a part-covered one would kink the band.
  if (row.length === ROWS + 1) columns.push(row)
}
if (columns.length < COLUMNS * 0.6) throw new Error(`Only ${columns.length} of ${COLUMNS + 1} columns found the visor's bottom edge.`)

const positions = columns.flat().flatMap((point) => [point.x, point.y, point.z].map((value) => Math.round(value * 1e5) / 1e5))
const indices = []
const at = (column, row) => column * (ROWS + 1) + row
for (let column = 0; column < columns.length - 1; column++) {
  for (let row = 0; row < ROWS; row++) {
    // Bottom row first in each column, so the winding faces outwards like the top band's.
    indices.push(at(column, row + 1), at(column, row), at(column + 1, row + 1), at(column + 1, row + 1), at(column, row), at(column + 1, row))
  }
}
// Its own texture layout, exact because the band is a grid: across by distance along the
// middle row, up the band from its bottom edge (v 0) to its top (v 1). And its length over
// its depth at the front, so the strip prints at its own proportions.
// Across goes by the angle round the helmet (columns are equal steps), so the strip stays
// centred on the face even where one end of the visor's edge dips more than the other.
const middleRow = ROWS >> 1
let length = 0
for (let column = 1; column < columns.length; column++) {
  const [a, b] = [columns[column][middleRow], columns[column - 1][middleRow]]
  length += Math.hypot(a.x - b.x, a.z - b.z)
}
const uvs = columns.flatMap((_, column) => Array.from({ length: ROWS + 1 }, (_, row) => [Math.round((column / (columns.length - 1)) * 1e5) / 1e5, row / ROWS])).flat()
const centre = columns[columns.length >> 1]
let frontDepth = 0
for (let row = 1; row <= ROWS; row++) frontDepth += centre[row].distanceTo(centre[row - 1])
const aspect = Math.round((length / frontDepth) * 100) / 100
writeFileSync(target, JSON.stringify({ aspect, positions, uvs, indices }))
console.log(`${target}: ${columns.length} columns × ${ROWS + 1}, ${Math.round((REACH * 180) / Math.PI)}° each side, depth ${depth.toFixed(4)} (top band ${topDepth.toFixed(4)})`)
