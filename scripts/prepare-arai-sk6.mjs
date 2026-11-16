// Turns the 3D artist's Arai SK-6 .glb into the file the website loads: parts renamed to
// what the builder looks for, the heaviest hardware simplified, and the whole file
// compressed. The shell's UVs are kept exactly (template artwork is drawn against them).
//
// Run again whenever the artist sends a new version:
//   node scripts/prepare-arai-sk6.mjs "D:/downloads/SK6 helmet.glb"

import { NodeIO, PropertyType } from "@gltf-transform/core"
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMaterialsClearcoat, KHRMaterialsIOR, KHRMaterialsTransmission } from "@gltf-transform/extensions"
import { dedup, prune, quantize, reorder, simplifyPrimitive, weld } from "@gltf-transform/functions"
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer"
import { Box3, BufferGeometry, DoubleSide, Matrix4, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three"

const [source, target = "public/models/arai-sk6.glb"] = process.argv.slice(2)
if (!source) throw new Error("Usage: node scripts/prepare-arai-sk6.mjs <artist file.glb> [output.glb]")

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder })
const document = await io.read(source)
const root = document.getRoot()

function findNode(name) {
  const node = root.listNodes().find((item) => item.getName().trim() === name)
  if (!node) throw new Error(`The model has no node called "${name}".`)
  return node
}
const optionalNode = (name) => root.listNodes().find((item) => item.getName().trim() === name)

/** Artist's name → the name the code looks for (the same names as the Bell KC7). */
const renames = {
  "HELMET SHELL": "Shell",
  visor: "Visor",
  "tape 2": "VisorStrip",
  "visor inner layer": "RubberEyeport",
  "helmet shell..004": "RubberBase",
  "rear spoiler": "Spoiler_Rear",
  "top spoiler": "Spoiler_Top",
  // The thin strip under the top spoiler belongs to it, so it hides with it.
  "top spoiler.001": "Spoiler_Top_Base",
  "spoiler front chin": "Spoiler_Chin",
  "VENT Remeshed": "ChinVent",
  "LOGO TOP": "AraiLogo_Front",
  sk: "AraiLogo_Back",
  "visor opener part": "VisorPivot",
  "visor opener part bolt": "VisorPivotBolt",
}
for (const [from, to] of Object.entries(renames)) findNode(from).setName(to)
// An empty placeholder the artist left in.
optionalNode("helmet shell..003")?.dispose()

// The website paints its own design on the shell: start from plain white gloss.
for (const primitive of findNode("Shell").getMesh().listPrimitives()) {
  primitive.getMaterial().setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setMetallicFactor(0).setRoughnessFactor(0.35).setBaseColorFactor([1, 1, 1, 1])
}
// The visor came as an opaque mirror: make it clear glass like the Bell KC7's, so the
// builder's tints and mirrored visors (step 12) work the same on both helmets.
{
  const visor = findNode("Visor").getMesh().listPrimitives()[0].getMaterial()
  visor.setBaseColorFactor([1, 1, 1, 1]).setMetallicFactor(0).setRoughnessFactor(0.015)
  const transmission = document.createExtension(KHRMaterialsTransmission)
  visor.setExtension("KHR_materials_transmission", transmission.createTransmission().setTransmissionFactor(1))
  const ior = document.createExtension(KHRMaterialsIOR)
  visor.setExtension("KHR_materials_ior", ior.createIOR().setIOR(1.5))
  const clearcoat = document.createExtension(KHRMaterialsClearcoat)
  visor.setExtension("KHR_materials_clearcoat", clearcoat.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(0.02))
}

// No lining came with the model, so through the clear visor you'd see the inside of the
// painted shell. A slightly smaller copy of the shell in matt black stands in for the foam.
{
  const shellNode = findNode("Shell")
  const source = shellNode.getMesh().listPrimitives()[0]
  const position = source.getAttribute("POSITION")
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let index = 0; index < position.getCount(); index++) {
    const point = position.getElement(index, [])
    for (let k = 0; k < 3; k++) [min[k], max[k]] = [Math.min(min[k], point[k]), Math.max(max[k], point[k])]
  }
  const centre = min.map((value, k) => (value + max[k]) / 2)
  const SCALE = 0.965
  const lining = source.clone()
  lining.setAttribute("TEXCOORD_0", null)
  lining.setMaterial(document.createMaterial("Lining").setBaseColorFactor([0.02, 0.02, 0.022, 1]).setMetallicFactor(0).setRoughnessFactor(0.95).setDoubleSided(true))
  // Its own copy of the points, pulled in towards the shell's centre.
  const shrunk = new Float32Array(position.getCount() * 3)
  for (let index = 0; index < position.getCount(); index++) {
    const point = position.getElement(index, [])
    for (let k = 0; k < 3; k++) shrunk[index * 3 + k] = centre[k] + (point[k] - centre[k]) * SCALE
  }
  lining.setAttribute("POSITION", document.createAccessor().setType("VEC3").setArray(shrunk).setBuffer(position.getBuffer()))
  // A part of its own beside the shell (not inside it), placed exactly like the shell.
  const interior = document.createNode("Interior").setMesh(document.createMesh("Interior").addPrimitive(lining))
  interior.setTranslation(shellNode.getTranslation()).setRotation(shellNode.getRotation()).setScale(shellNode.getScale())
  const parent = shellNode.getParentNode()
  if (parent) parent.addChild(interior)
  else root.listScenes()[0].addChild(interior)
}

// The chin vent came without a material: dark plastic, like the Bell's grilles.
{
  const vent = findNode("ChinVent").getMesh().listPrimitives()[0]
  if (!vent.getMaterial()) vent.setMaterial(document.createMaterial("ChinVent").setBaseColorFactor([0.06, 0.06, 0.07, 1]).setRoughnessFactor(0.6))
}

// The artist's sticker band ("tape 2") runs straight back and ends in mid-air at the sides,
// clear of the visor's curved top edge. A new band is traced on the visor's own outer
// surface instead: along its top edge, round to the same points at the sides and as deep
// as the artist's at the front, a hair proud of the glass.
{
  const visorNode = findNode("Visor")
  const stripNode = findNode("VisorStrip")
  const worldPoints = (node) => {
    const matrix = new Matrix4().fromArray(node.getWorldMatrix())
    const primitive = node.getMesh().listPrimitives()[0]
    const position = primitive.getAttribute("POSITION")
    const points = []
    for (let index = 0; index < position.getCount(); index++) points.push(new Vector3().fromArray(position.getElement(index, [])).applyMatrix4(matrix))
    return { points, indices: primitive.getIndices()?.getArray() }
  }
  const visor = worldPoints(visorNode)
  const visorGeometry = new BufferGeometry().setFromPoints(visor.points)
  if (visor.indices) visorGeometry.setIndex(Array.from(visor.indices))
  const visorMesh = new Mesh(visorGeometry, new MeshBasicMaterial({ side: DoubleSide }))
  const visorBox = new Box3().setFromPoints(visor.points)
  const shellBox = new Box3().setFromPoints(worldPoints(findNode("Shell")).points)
  const axis = shellBox.getCenter(new Vector3())
  const angleOf = (point) => Math.atan2(point.x - axis.x, point.z - axis.z)

  // The artist's band: how far round it goes, and how deep it is at the front.
  const old = worldPoints(stripNode).points
  const oldAngles = old.map(angleOf)
  const reach = Math.min(-Math.min(...oldAngles), Math.max(...oldAngles))
  const oldBox = new Box3().setFromPoints(old)
  const front = old.filter((point) => Math.abs(point.x - axis.x) < (oldBox.max.x - oldBox.min.x) * 0.04)
  const depth = Math.max(...front.map((point) => point.y)) - Math.min(...front.map((point) => point.y))

  const raycaster = new Raycaster()
  /** The outermost point of the visor straight out from the axis at this height, or null. */
  const visorAt = (angle, y) => {
    const direction = new Vector3(Math.sin(angle), 0, Math.cos(angle))
    raycaster.set(new Vector3(axis.x, y, axis.z), direction)
    const hits = raycaster.intersectObject(visorMesh)
    return hits.length ? hits[hits.length - 1] : null
  }
  // The visor's top edge slides under the shell and its rubber trim, so the band starts
  // where the visor first shows from outside, not at the glass's own (hidden) edge.
  const cover = ["Shell", "RubberEyeport"].map((name) => {
    const part = worldPoints(findNode(name))
    const geometry = new BufferGeometry().setFromPoints(part.points)
    if (part.indices) geometry.setIndex(Array.from(part.indices))
    return new Mesh(geometry, new MeshBasicMaterial({ side: DoubleSide }))
  })
  const outside = shellBox.getSize(new Vector3()).length()
  /** True when, looking in from outside at this angle and height, the first thing seen is the visor. */
  const visorShows = (angle, y) => {
    const outward = new Vector3(Math.sin(angle), 0, Math.cos(angle))
    raycaster.set(new Vector3(axis.x, y, axis.z).addScaledVector(outward, outside), outward.clone().negate())
    const [first] = raycaster.intersectObjects([visorMesh, ...cover], false)
    return first?.object === visorMesh
  }
  /** The top of the visible visor at this angle. */
  const topAt = (angle) => {
    const step = (visorBox.max.y - visorBox.min.y) / 300
    let y = visorBox.max.y
    while (y > visorBox.min.y && !visorShows(angle, y)) y -= step
    let [low, high] = [y, y + step]
    for (let k = 0; k < 14; k++) {
      const middle = (low + high) / 2
      if (visorShows(angle, middle)) low = middle
      else high = middle
    }
    return low
  }

  const COLUMNS = 160
  const ROWS = 8
  // A small gap below the trim, like a sticker applied by hand.
  const inset = (visorBox.max.y - visorBox.min.y) * 0.012
  const proud = (visorBox.max.x - visorBox.min.x) * 0.0015
  const positions = []
  for (let column = 0; column <= COLUMNS; column++) {
    const angle = -reach + (2 * reach * column) / COLUMNS
    const top = topAt(angle) - inset
    for (let row = 0; row <= ROWS; row++) {
      const hit = visorAt(angle, top - (depth * row) / ROWS) ?? visorAt(angle, top)
      const normal = hit.face.normal.clone()
      const outward = new Vector3(Math.sin(angle), 0, Math.cos(angle))
      if (normal.dot(outward) < 0) normal.negate()
      positions.push(hit.point.clone().addScaledVector(normal, proud))
    }
  }
  const indices = []
  const at = (column, row) => column * (ROWS + 1) + row
  for (let column = 0; column < COLUMNS; column++) {
    for (let row = 0; row < ROWS; row++) {
      indices.push(at(column, row), at(column, row + 1), at(column + 1, row), at(column + 1, row), at(column, row + 1), at(column + 1, row + 1))
    }
  }
  const band = new BufferGeometry().setFromPoints(positions)
  band.setIndex(indices)
  // Into the strip part's own space, where the website looks for it.
  band.applyMatrix4(new Matrix4().fromArray(stripNode.getWorldMatrix()).invert())
  band.computeVertexNormals()

  const primitive = stripNode.getMesh().listPrimitives()[0]
  const buffer = primitive.getAttribute("POSITION").getBuffer()
  for (const semantic of primitive.listSemantics()) primitive.setAttribute(semantic, null)
  primitive.setAttribute("POSITION", document.createAccessor().setType("VEC3").setArray(new Float32Array(band.getAttribute("position").array)).setBuffer(buffer))
  primitive.setAttribute("NORMAL", document.createAccessor().setType("VEC3").setArray(new Float32Array(band.getAttribute("normal").array)).setBuffer(buffer))
  primitive.setIndices(document.createAccessor().setType("SCALAR").setArray(new Uint32Array(indices)).setBuffer(buffer))
  console.log(`Visor sticker band: ${COLUMNS}×${ROWS} on the visor, ${((reach * 180) / Math.PI).toFixed(0)}° each side.`)
}

await document.transform(weld())

// Most of the file's weight is in small parts the camera barely sees up close.
const simplify = {
  VisorPivot: 0.04,
  RubberEyeport: 0.25,
  Spoiler_Rear: 0.35,
  Spoiler_Chin: 0.5,
  "visor opener part 2.007": 0.1,
  "visor opener part 2.004": 0.2,
  "visor opener part 2.005": 0.3,
  "visor opener part 2.003": 0.3,
  "visor opener part 2.006": 0.3,
}
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
