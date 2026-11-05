// Draws a guide for the template designer from the artist's model: the shell's UV pieces,
// which part of the helmet each one is, lines of equal height and direction around the
// helmet, and numbered points showing which edges meet on the real helmet.
//
//   node scripts/make-uv-guide.mjs "D:/downloads/KC7 helmet.glb" docs/designer
//
// Writes bell-kc7-uv-guide.svg (import as a layer, same 1024 canvas as the artwork) and a .png.

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { NodeIO } from "@gltf-transform/core"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"
import sharp from "sharp"

const [modelFile, outDir] = process.argv.slice(2)
if (!outDir) throw new Error("Usage: node scripts/make-uv-guide.mjs <artist file.glb> <output folder>")

const SIZE = 1024
const root = (await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(modelFile)).getRoot()
const node = root.listNodes().find((item) => item.getName() === "helmet shell")
const primitive = node.getMesh().listPrimitives()[0]
const matrix = node.getWorldMatrix()
const rawPositions = primitive.getAttribute("POSITION").getArray()
const uvs = primitive.getAttribute("TEXCOORD_0").getArray()
const indices = primitive.getIndices().getArray()
const count = rawPositions.length / 3

const position = new Float32Array(count * 3)
for (let i = 0; i < count; i++) {
  const [x, y, z] = [rawPositions[i * 3], rawPositions[i * 3 + 1], rawPositions[i * 3 + 2]]
  for (let axis = 0; axis < 3; axis++) {
    position[i * 3 + axis] = matrix[axis] * x + matrix[axis + 4] * y + matrix[axis + 8] * z + matrix[axis + 12]
  }
}

const P = (i) => [position[i * 3], position[i * 3 + 1], position[i * 3 + 2]]
const UV = (i) => [uvs[i * 2] * SIZE, uvs[i * 2 + 1] * SIZE]
const fixed = (value) => value.toFixed(1)

// UV pieces, by which vertices are joined.
const parent = Int32Array.from({ length: count }, (_, i) => i)
const find = (a) => {
  while (parent[a] !== a) {
    parent[a] = parent[parent[a]]
    a = parent[a]
  }
  return a
}
for (let t = 0; t < indices.length; t += 3) {
  parent[find(indices[t])] = find(indices[t + 1])
  parent[find(indices[t + 1])] = find(indices[t + 2])
}

let fill = ""
const outlineCounts = new Map()
for (let t = 0; t < indices.length; t += 3) {
  const corners = [indices[t], indices[t + 1], indices[t + 2]]
  const [a, b, c] = corners.map(UV)
  fill += `M${fixed(a[0])} ${fixed(a[1])}L${fixed(b[0])} ${fixed(b[1])}L${fixed(c[0])} ${fixed(c[1])}Z`
  corners.forEach((from, e) => {
    const to = corners[(e + 1) % 3]
    const key = from < to ? `${from}_${to}` : `${to}_${from}`
    outlineCounts.set(key, (outlineCounts.get(key) ?? 0) + 1)
  })
}
let outline = ""
for (const [key, uses] of outlineCounts) {
  if (uses !== 1) continue
  const [a, b] = key.split("_").map(Number).map(UV)
  outline += `M${fixed(a[0])} ${fixed(a[1])}L${fixed(b[0])} ${fixed(b[1])}`
}

/** Traces where a value measured on the helmet crosses given levels, in UV space. */
function contour(measure, levels) {
  let d = ""
  for (let t = 0; t < indices.length; t += 3) {
    const corners = [indices[t], indices[t + 1], indices[t + 2]]
    const values = corners.map((i) => measure(P(i)))
    if (values.some((value) => value === null)) continue
    // Direction jumps from +180 to -180 at the back centre; that is not a real crossing.
    if (Math.max(...values) - Math.min(...values) > 180) continue
    for (const level of levels) {
      const crossings = []
      for (let e = 0; e < 3; e++) {
        const [i, j] = [e, (e + 1) % 3]
        if (values[i] < level !== values[j] < level) {
          const share = (level - values[i]) / (values[j] - values[i])
          const [a, b] = [UV(corners[i]), UV(corners[j])]
          crossings.push([a[0] + (b[0] - a[0]) * share, a[1] + (b[1] - a[1]) * share])
        }
      }
      if (crossings.length === 2) d += `M${fixed(crossings[0][0])} ${fixed(crossings[0][1])}L${fixed(crossings[1][0])} ${fixed(crossings[1][1])}`
    }
  }
  return d
}

const heights = contour(([, y]) => y, Array.from({ length: 13 }, (_, i) => -0.6 + i * 0.1))
// Direction around the helmet seen from above; front is 0. Skipped at the very top, where it bunches up.
const around = contour(
  ([x, , z]) => (Math.hypot(x, z) < 0.12 ? null : (Math.atan2(x, z) * 180) / Math.PI),
  [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150],
)

// Points where two UV pieces meet: the same place on the helmet, listed under both pieces.
const key3d = (i) => P(i).map((value) => Math.round(value * 2000)).join(",")
const byPlace = new Map()
for (let i = 0; i < count; i++) {
  const key = key3d(i)
  if (!byPlace.has(key)) byPlace.set(key, [])
  byPlace.get(key).push(i)
}
const pairs = []
for (const group of byPlace.values()) {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) if (find(group[i]) !== find(group[j])) pairs.push([group[i], group[j]])
  }
}

const pieces = [...new Set(Array.from({ length: count }, (_, i) => find(i)))].filter((piece) => {
  let verts = 0
  for (let i = 0; i < count; i++) if (find(i) === piece) verts++
  return verts > 100
})
const pieceCentreX = (piece) => {
  let sum = 0
  let verts = 0
  for (let i = 0; i < count; i++) {
    if (find(i) === piece) {
      sum += position[i * 3]
      verts++
    }
  }
  return sum / verts
}
const leftPiece = pieces.find((piece) => pieceCentreX(piece) > 0.2)
const rightPiece = pieces.find((piece) => pieceCentreX(piece) < -0.2)
const backPiece = pieces.find((piece) => piece !== leftPiece && piece !== rightPiece)

/** Numbered points along one seam: each number appears twice, one on each piece. */
function markers(pieceA, pieceB, prefix, colour, every, orderBy) {
  const seam = pairs
    .map(([a, b]) => (find(a) === pieceA && find(b) === pieceB ? [a, b] : find(a) === pieceB && find(b) === pieceA ? [b, a] : null))
    .filter(Boolean)
    .sort((one, two) => orderBy(P(one[0])) - orderBy(P(two[0])))
  const chosen = seam.filter((_, index) => index % every === 0)
  let out = ""
  for (const [position, pair] of chosen.entries()) {
    for (const vertex of pair) {
      const [x, y] = UV(vertex)
      out += `<circle cx="${fixed(x)}" cy="${fixed(y)}" r="9" fill="${colour}" stroke="#fff" stroke-width="1.5"/>`
      out += `<text x="${fixed(x)}" y="${fixed(y + 3.2)}" font-size="${prefix.length > 1 ? 7 : 9}" font-weight="700" text-anchor="middle" fill="#fff">${prefix}${position + 1}</text>`
    }
  }
  return out
}

const seamMarks =
  markers(leftPiece, backPiece, "L", "#d0102a", 5, ([, y]) => -y) +
  markers(rightPiece, backPiece, "R", "#0a7d3c", 5, ([, y]) => -y) +
  markers(leftPiece, rightPiece, "C", "#7a1fc2", 8, ([, y, z]) => -Math.atan2(y + 0.2, z))

function pieceCentre(piece) {
  let [minU, maxU, minV, maxV] = [Infinity, -Infinity, Infinity, -Infinity]
  for (let i = 0; i < count; i++) {
    if (find(i) !== piece) continue
    const [u, v] = UV(i)
    minU = Math.min(minU, u)
    maxU = Math.max(maxU, u)
    minV = Math.min(minV, v)
    maxV = Math.max(maxV, v)
  }
  return [(minU + maxU) / 2, (minV + maxV) / 2]
}

/** The UV spot on a piece nearest a point on the helmet. */
function spot(piece, target) {
  let best = -1
  let bestDistance = Infinity
  for (let i = 0; i < count; i++) {
    if (find(i) !== piece) continue
    const [x, y, z] = P(i)
    const distance = Math.hypot(x - target[0], y - target[1], z - target[2])
    if (distance < bestDistance) {
      bestDistance = distance
      best = i
    }
  }
  return UV(best)
}

const label = ([x, y], text, size = 13, colour = "#111") =>
  `<text x="${fixed(x)}" y="${fixed(y)}" font-size="${size}" font-weight="700" text-anchor="middle" fill="${colour}" stroke="#fff" stroke-width="3" paint-order="stroke">${text}</text>`

const landmarks = [
  [leftPiece, [0.14, 0.62, 0.12], "TOP OF HEAD"],
  [rightPiece, [-0.14, 0.62, 0.12], "TOP OF HEAD"],
  [leftPiece, [0.16, -0.48, 0.86], "CHIN"],
  [rightPiece, [-0.16, -0.48, 0.86], "CHIN"],
  [leftPiece, [0.25, 0.45, 0.75], "ABOVE VISOR"],
  [rightPiece, [-0.25, 0.45, 0.75], "ABOVE VISOR"],
  [leftPiece, [0.7, 0, -0.2], "SIDE, BY THE EAR"],
  [rightPiece, [-0.7, 0, -0.2], "SIDE, BY THE EAR"],
  [backPiece, [0, 0.55, -0.75], "TOWARDS TOP OF HEAD"],
  [backPiece, [0, -0.62, -0.75], "BOTTOM EDGE, NECK"],
]

const [backX, backY] = pieceCentre(backPiece)
const [leftX, leftY] = pieceCentre(leftPiece)
const [rightX, rightY] = pieceCentre(rightPiece)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" font-family="Arial, Helvetica, sans-serif">
<rect width="${SIZE}" height="${SIZE}" fill="#8d8d8d"/>
<path id="uv-pieces" d="${fill}" fill="#f2f2f2"/>
<path id="height-lines" d="${heights}" stroke="#1f6fd8" stroke-width="0.8" fill="none"/>
<path id="direction-lines" d="${around}" stroke="#e8820c" stroke-width="0.8" fill="none"/>
<path id="uv-edges" d="${outline}" stroke="#000" stroke-width="1.6" fill="none"/>
<g id="seam-points">${seamMarks}</g>
<g id="labels">
${label([backX, backY - 10], "BACK OF HELMET", 26)}
${label([backX, backY + 16], "this piece is NOT the crown or the front", 15, "#b00020")}
${label([leftX + 70, leftY - 85], "WEARER'S LEFT HALF", 20)}
${label([leftX + 70, leftY - 66], "front, top and side", 13)}
${label([105, 795], "VISOR OPENING", 12, "#b00020")}
${label([rightX - 70, rightY - 85], "WEARER'S RIGHT HALF", 20)}
${label([rightX - 70, rightY - 66], "front, top and side", 13)}
${label([919, 795], "VISOR OPENING", 12, "#b00020")}
${landmarks.map(([piece, target, text]) => label(spot(piece, target), text, 11, "#333")).join("\n")}
</g>
<g id="key" font-size="12" font-weight="700">
<rect x="8" y="8" width="262" height="146" rx="8" fill="#fff" stroke="#000"/>
<text x="18" y="28" font-size="14">HOW TO READ THIS</text>
<line x1="18" y1="46" x2="44" y2="46" stroke="#1f6fd8" stroke-width="2"/><text x="52" y="50">Same height on the helmet</text>
<line x1="18" y1="66" x2="44" y2="66" stroke="#e8820c" stroke-width="2"/><text x="52" y="70">Same direction around it</text>
<circle cx="31" cy="88" r="9" fill="#d0102a"/><text x="52" y="92">L1 meets L1: left half to back</text>
<circle cx="31" cy="110" r="9" fill="#0a7d3c"/><text x="52" y="114">R1 meets R1: right half to back</text>
<circle cx="31" cy="132" r="9" fill="#7a1fc2"/><text x="52" y="136">C1 meets C1: left to right half</text>
</g>
</svg>`

await mkdir(outDir, { recursive: true })
await writeFile(path.join(outDir, "bell-kc7-uv-guide.svg"), svg)
await sharp(Buffer.from(svg), { density: 144 }).png().toFile(path.join(outDir, "bell-kc7-uv-guide.png"))
console.log(`Wrote the guide to ${outDir}. Pieces: back ${backPiece}, left ${leftPiece}, right ${rightPiece}. Seam points: ${pairs.length}.`)
