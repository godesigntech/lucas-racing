// Turns the 3D artist's Bell KC7 .glb into the file the website loads: parts renamed to
// what the code looks for, shared meshes split left/right, heavy meshes simplified, and
// the whole file compressed. The shell's geometry and every UV are left alone, because
// the template masks are cut against them.
//
// Run again whenever the artist sends a new version:
//   node scripts/prepare-bell-kc7.mjs "D:/downloads/KC7 helmet.glb"

import { NodeIO, PropertyType } from "@gltf-transform/core"
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions"
import { compactPrimitive, dedup, prune, quantize, reorder, simplifyPrimitive, weld } from "@gltf-transform/functions"
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer"

const source = process.argv[2]
const target = process.argv[3] ?? "public/models/bell-kc7.glb"
if (!source) throw new Error("Usage: node scripts/prepare-bell-kc7.mjs <artist file.glb> [output.glb]")

await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder })
const document = await io.read(source)
const root = document.getRoot()

function findNode(name) {
  const node = root.listNodes().find((item) => item.getName().trim() === name)
  if (!node) throw new Error(`The model has no node called "${name}".`)
  return node
}

/** Artist's name → the name the code looks for. */
const renames = {
  "helmet shell": "Shell",
  visor: "Visor",
  "visor tape": "VisorStrip",
  "visor washer": "VisorWasher",
  "visor inner border": "RubberEyeport",
  "rear spoiler": "Spoiler_HP7_F1_Small",
  "top spoiler": "Spoiler_Top",
  "helmet shell.001": "ShellRivets",
}
for (const [from, to] of Object.entries(renames)) findNode(from).setName(to)

/** Where a triangle's centre sits in the helmet's own space. */
function centroid(position, indices, triangle, matrix) {
  const sum = [0, 0, 0]
  for (let corner = 0; corner < 3; corner++) {
    const [x, y, z] = position.getElement(indices.getScalar(triangle * 3 + corner), [])
    sum[0] += matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]
    sum[1] += matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]
    sum[2] += matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]
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
const inner = findNode("inner part helmet")
const [foam, rubber] = inner.getMesh().listPrimitives()
inner.setName("Interior")
inner.getMesh().removePrimitive(rubber)
const base = document.createNode("RubberBase").setMesh(document.createMesh("RubberBase").addPrimitive(rubber))
base.setTranslation(inner.getTranslation()).setRotation(inner.getRotation()).setScale(inner.getScale())
root.listScenes()[0].addChild(base)
void foam

splitNode("front ventilation", leftOrRight("GrillZ_01", "GrillZ_02"))
splitNode("nut bolt top", leftOrRight("VisorScrew_Left", "VisorScrew_Right"))
// Each spoiler brings its own bolts, so hiding a spoiler leaves the shell clean.
splitNode("spoiler connectors.001", ([, , z]) => (z < -0.4 ? "Spoiler_HP7_F1_Small_Bolts" : "Spoiler_Top_Bolts"))

// The rivets on the sides were left a stray pale pink.
findNode("ShellRivets").getMesh().listPrimitives()[0].getMaterial().setBaseColorFactor([0.3, 0.3, 0.3, 1])

await document.transform(weld())

// Most of the file's weight is in two small parts the camera barely sees up close.
const simplify = { GrillZ_01: 0.06, GrillZ_02: 0.06, RubberEyeport: 0.2, Spoiler_HP7_F1_Small: 0.5, Spoiler_Top_Bolts: 0.4, Spoiler_HP7_F1_Small_Bolts: 0.4, "nut bolt  middle": 0.3, "nut bolt  middle.001": 0.3 }
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
