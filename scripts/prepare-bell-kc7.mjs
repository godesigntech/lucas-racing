// Turns the 3D artist's Bell KC7 .glb into the file the website loads: parts renamed to
// what the code looks for, shared meshes split left/right, heavy meshes simplified, and
// the whole file compressed. The shell's UVs are left alone (the template masks are cut
// against them), except where the artist re-made part of the shell without them: see
// --uv-reference below.
//
// Run again whenever the artist sends a new version:
//   node scripts/prepare-bell-kc7.mjs "D:/downloads/KC7 helmet 001.glb" --uv-reference "D:/downloads/KC7 helmet 2.glb"
//
// --uv-reference: an earlier model whose shell has good UVs. Any part of the new shell
// that came as its own piece with scrambled UVs (the crown, once the vent holes were cut
// through it) takes its UVs from the same spot on that shell, then joins the main shell.

import { NodeIO, PropertyType } from "@gltf-transform/core"
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions"
import { compactPrimitive, dedup, joinPrimitives, prune, quantize, reorder, simplifyPrimitive, unweldPrimitive, weld } from "@gltf-transform/functions"
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer"

const args = process.argv.slice(2)
const option = (name) => {
  const at = args.indexOf(name)
  if (at === -1) return undefined
  const [, value] = args.splice(at, 2)
  return value
}
const uvReference = option("--uv-reference")

/**
 * How far round the texture a triangle's corners may look for their UVs. Along a seam the
 * two sides are far apart on the texture though they touch on the helmet, so a triangle
 * there must take all its corners from the side its centre is on, or it would stretch
 * across the texture.
 */
const UV_NEIGHBOURHOOD = 0.05
const [source, target = "public/models/bell-kc7.glb"] = args
if (!source) throw new Error("Usage: node scripts/prepare-bell-kc7.mjs <artist file.glb> [output.glb] [--uv-reference <earlier model.glb>]")

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder })
const document = await io.read(source)
const root = document.getRoot()

function findNode(name, from = root) {
  const node = from.listNodes().find((item) => item.getName().trim() === name)
  if (!node) throw new Error(`The model has no node called "${name}".`)
  return node
}
/** The first node whose name starts with one of these (the artist renames the shell between versions). */
function findNodeLike(prefixes, from = root) {
  const node = from.listNodes().find((item) => item.getMesh() && prefixes.some((prefix) => item.getName().trim().startsWith(prefix)))
  if (!node) throw new Error(`The model has no node starting with "${prefixes.join('" or "')}".`)
  return node
}
const optionalNode = (name) => root.listNodes().find((item) => item.getName().trim() === name)

const transform = (matrix, [x, y, z]) => [
  matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
  matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
  matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
]

// ---------------------------------------------------------------------------
// The shell: one mesh, one primitive, every part of it with proper UVs.

const shell = findNodeLike(["helmet shell"])
shell.setName("Shell")
{
  const primitives = shell.getMesh().listPrimitives()
  // The main shell is the piece whose UVs sit in the template's band; anything else needs fixing.
  const main = primitives.reduce((best, primitive) => (primitive.getAttribute("POSITION").getCount() > best.getAttribute("POSITION").getCount() ? primitive : best))
  const extras = primitives.filter((primitive) => primitive !== main)
  if (extras.length > 0) {
    if (!uvReference) throw new Error("The shell comes in several pieces. Pass --uv-reference <earlier model.glb> so the extra pieces get proper UVs.")
    const reference = await io.read(uvReference)
    const referenceShell = findNodeLike(["helmet shell", "Shell"], reference.getRoot())
    const surface = buildSurface(referenceShell)
    const matrix = shell.getWorldMatrix()
    for (const extra of extras) {
      // Every triangle gets its own corners, so a triangle can take UVs from one island.
      await unwrapFrom(extra, surface, matrix)
      extra.setMaterial(main.getMaterial())
      matchAttributes(extra, main)
      console.log(`  main: ${main.listSemantics().join(", ")} · extra: ${extra.listSemantics().join(", ")}`)
    }
    const joined = joinPrimitives([main, ...extras])
    for (const primitive of primitives) shell.getMesh().removePrimitive(primitive)
    shell.getMesh().addPrimitive(joined)
    console.log(`Shell: ${extras.length} extra piece(s) given UVs from ${uvReference} and joined to the shell.`)
  }
}

/** The reference shell's triangles in helmet space, with their UVs and where they sit on the texture. */
function buildSurface(node) {
  const matrix = node.getWorldMatrix()
  const triangles = []
  for (const primitive of node.getMesh().listPrimitives()) {
    const position = primitive.getAttribute("POSITION")
    const uv = primitive.getAttribute("TEXCOORD_0")
    const indices = primitive.getIndices()
    for (let triangle = 0; triangle < indices.getCount() / 3; triangle++) {
      const corners = [0, 1, 2].map((corner) => indices.getScalar(triangle * 3 + corner))
      const uvs = corners.map((index) => uv.getElement(index, []))
      triangles.push({
        points: corners.map((index) => transform(matrix, position.getElement(index, []))),
        uvs,
        uvCentre: [(uvs[0][0] + uvs[1][0] + uvs[2][0]) / 3, (uvs[0][1] + uvs[1][1] + uvs[2][1]) / 3],
      })
    }
  }
  return triangles
}

/** Closest point on triangle abc to p, as barycentric weights (Ericson, Real-Time Collision Detection). */
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

function nearest(point, triangles) {
  let best = null
  let bestDistance = Infinity
  for (const triangle of triangles) {
    const weights = closestWeights(point, triangle.points)
    const q = [0, 1, 2].map((k) => weights[0] * triangle.points[0][k] + weights[1] * triangle.points[1][k] + weights[2] * triangle.points[2][k])
    const distance = (q[0] - point[0]) ** 2 + (q[1] - point[1]) ** 2 + (q[2] - point[2]) ** 2
    if (distance < bestDistance) [best, bestDistance] = [{ triangle, weights }, distance]
  }
  return best
}

/** Gives each triangle of `primitive` the UVs of the same spot on the reference surface, all from one side of any seam. */
async function unwrapFrom(primitive, surface, matrix) {
  unweldPrimitive(primitive) // every triangle gets its own three vertices
  const position = primitive.getAttribute("POSITION")
  const count = position.getCount()
  const uvs = new Float32Array(count * 2)
  for (let triangle = 0; triangle < count / 3; triangle++) {
    const points = [0, 1, 2].map((corner) => transform(matrix, position.getElement(triangle * 3 + corner, [])))
    const centre = [0, 1, 2].map((k) => (points[0][k] + points[1][k] + points[2][k]) / 3)
    const [cu, cv] = nearest(centre, surface).triangle.uvCentre
    const candidates = surface.filter((item) => Math.abs(item.uvCentre[0] - cu) < UV_NEIGHBOURHOOD && Math.abs(item.uvCentre[1] - cv) < UV_NEIGHBOURHOOD)
    points.forEach((point, corner) => {
      const { triangle: hit, weights } = nearest(point, candidates)
      uvs[(triangle * 3 + corner) * 2] = weights[0] * hit.uvs[0][0] + weights[1] * hit.uvs[1][0] + weights[2] * hit.uvs[2][0]
      uvs[(triangle * 3 + corner) * 2 + 1] = weights[0] * hit.uvs[0][1] + weights[1] * hit.uvs[1][1] + weights[2] * hit.uvs[2][1]
    })
  }
  primitive.setAttribute("TEXCOORD_0", document.createAccessor().setType("VEC2").setArray(uvs).setBuffer(position.getBuffer()))
  // Indexed again, so it can join the main shell.
  primitive.setIndices(document.createAccessor().setType("SCALAR").setArray(Uint32Array.from({ length: count }, (_, index) => index)).setBuffer(position.getBuffer()))
}

/** Gives `extra` exactly the attributes `main` has, so the two can be joined. */
function matchAttributes(extra, main) {
  for (const semantic of extra.listSemantics()) if (!main.getAttribute(semantic)) extra.setAttribute(semantic, null)
  for (const semantic of main.listSemantics()) {
    if (extra.getAttribute(semantic)) continue
    const like = main.getAttribute(semantic)
    const size = like.getElementSize()
    const fill = new Float32Array(extra.getAttribute("POSITION").getCount() * size)
    // A missing colour or tangent: white / a neutral tangent is what the main shell's mostly are.
    if (semantic.startsWith("COLOR")) fill.fill(1)
    extra.setAttribute(semantic, document.createAccessor().setType(like.getType()).setArray(fill).setBuffer(like.getBuffer()))
  }
  // Same index type as the main shell.
  const indices = main.getIndices()
  if (indices && extra.getIndices()) {
    const ArrayType = indices.getArray().constructor
    extra.getIndices().setArray(ArrayType.from(extra.getIndices().getArray()))
  }
}

// ---------------------------------------------------------------------------
// Everything else.

/** Artist's name → the name the code looks for. */
const renames = {
  visor: "Visor",
  "visor tape": "VisorStrip",
  "visor washer": "VisorWasher",
  "visor inner line": "RubberEyeport",
  "rear spoiler": "Spoiler_HP7_F1_Small",
  "top spoiler": "Spoiler_Top",
  nuts: "ShellRivets",
}
for (const [from, to] of Object.entries(renames)) findNode(from).setName(to)
// Added in later versions.
optionalNode("chin spoiler")?.setName("Spoiler_Chin")

// Bell badges, named by where they sit: forehead, left and right sides, and the back.
for (const node of root.listNodes().filter((item) => item.getName().trim().startsWith("bell-helmets-seeklogo"))) {
  const primitive = node.getMesh().listPrimitives()[0]
  const position = primitive.getAttribute("POSITION")
  const centre = [0, 0, 0]
  for (let index = 0; index < position.getCount(); index++) {
    const point = transform(node.getWorldMatrix(), position.getElement(index, []))
    for (let k = 0; k < 3; k++) centre[k] += point[k] / position.getCount()
  }
  const [x, , z] = centre
  // The side badges sit on the visor pivots, on top of the visor sticker: the client wants
  // only the forehead and back badges.
  if (Math.abs(x) > 0.3) node.dispose()
  else node.setName(z > 0 ? "BellLogo_Front" : "BellLogo_Back")
}

/** Where a triangle's centre sits in the helmet's own space. */
function centroid(position, indices, triangle, matrix) {
  const sum = [0, 0, 0]
  for (let corner = 0; corner < 3; corner++) {
    const point = transform(matrix, position.getElement(indices.getScalar(triangle * 3 + corner), []))
    for (let k = 0; k < 3; k++) sum[k] += point[k]
  }
  return sum.map((value) => value / 3)
}

/** Splits one mesh into a node per group, choosing a group for each triangle. */
function splitNode(name, groupOf) {
  const node = findNode(name)
  const matrix = node.getWorldMatrix()
  const primitive = node.getMesh().listPrimitives()[0]
  const position = primitive.getAttribute("POSITION")
  const indices = primitive.getIndices()
  const groups = new Map()
  for (let triangle = 0; triangle < indices.getCount() / 3; triangle++) {
    const group = groupOf(centroid(position, indices, triangle, matrix))
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group).push(indices.getScalar(triangle * 3), indices.getScalar(triangle * 3 + 1), indices.getScalar(triangle * 3 + 2))
  }
  for (const [group, list] of groups) {
    const part = primitive.clone()
    part.setIndices(document.createAccessor().setType("SCALAR").setArray(new Uint32Array(list)).setBuffer(indices.getBuffer()))
    compactPrimitive(part)
    const child = document.createNode(group).setMesh(document.createMesh(group).addPrimitive(part))
    child.setTranslation(node.getTranslation()).setRotation(node.getRotation()).setScale(node.getScale())
    root.listScenes()[0].addChild(child)
  }
  node.dispose()
}

const leftOrRight = (left, right) => ([x]) => (x > 0 ? left : right)

// Foam and the rubber base trim came as one mesh with two materials.
const inner = findNode("inner foam")
const [, rubber] = inner.getMesh().listPrimitives()
inner.setName("Interior")
inner.getMesh().removePrimitive(rubber)
const base = document.createNode("RubberBase").setMesh(document.createMesh("RubberBase").addPrimitive(rubber))
base.setTranslation(inner.getTranslation()).setRotation(inner.getRotation()).setScale(inner.getScale())
root.listScenes()[0].addChild(base)

splitNode("ventilation", leftOrRight("GrillZ_01", "GrillZ_02"))
// The top pair of bolts are the visor pivots customers can colour; the lower pair stay as they are.
splitNode("nut bolts", ([x, y]) => (y < -0.03 ? "LowerBolts" : x > 0 ? "VisorScrew_Left" : "VisorScrew_Right"))
// Each spoiler brings its own bolts, so hiding a spoiler leaves the shell clean.
splitNode("top nutbolts", ([, , z]) => (z < -0.4 ? "Spoiler_HP7_F1_Small_Bolts" : "Spoiler_Top_Bolts"))

// The artist baked one design into the shell; the website paints its own, so these go.
for (const primitive of findNode("Shell").getMesh().listPrimitives()) {
  primitive.getMaterial().setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setMetallicFactor(0).setRoughnessFactor(0.35).setBaseColorFactor([1, 1, 1, 1])
}

// The rivets on the sides were left a stray pale pink.
findNode("ShellRivets").getMesh().listPrimitives()[0].getMaterial().setBaseColorFactor([0.3, 0.3, 0.3, 1])

await document.transform(weld())

// Most of the file's weight is in small parts the camera barely sees up close.
const simplify = { GrillZ_01: 0.06, GrillZ_02: 0.06, RubberEyeport: 0.2, Spoiler_HP7_F1_Small: 0.5, Spoiler_Top_Bolts: 0.2, Spoiler_HP7_F1_Small_Bolts: 0.2, "nut bolt  middle": 0.3, "nut bolt  middle.001": 0.3 }
for (const [name, ratio] of Object.entries(simplify)) {
  const mesh = root.listNodes().find((item) => item.getName() === name)?.getMesh()
  for (const primitive of mesh?.listPrimitives() ?? []) simplifyPrimitive(primitive, { simplifier: MeshoptSimplifier, ratio, error: 0.002 })
}

await document.transform(
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  prune({ keepAttributes: true }),
  reorder({ encoder: MeshoptEncoder }),
  // UVs stay as exact floats: quantizing them could shift them against the template masks.
  quantize({ pattern: /^(POSITION|NORMAL)(_\d+)?$/, quantizePosition: 14, quantizeNormal: 12 }),
)
document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE })

await io.write(target, document)

let triangles = 0
for (const mesh of root.listMeshes()) for (const primitive of mesh.listPrimitives()) triangles += primitive.getIndices().getCount() / 3
console.log(`Wrote ${target}: ${root.listNodes().length} parts, ${Math.round(triangles).toLocaleString()} triangles.`)
console.log(root.listNodes().map((node) => node.getName()).join(", "))
