import { BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Matrix4, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3, type Object3D } from "three"

import { brandedStickerUrl, findStickerDesign, recolouredSticker, stickerColours } from "@/lib/helmet-3d/sticker-designs"

import type { VisorStrip } from "@/types/configurator"

import { canvasFont } from "./helmet-fonts"

/**
 * Step 13's printed band across the top of the visor: the model's own "VisorStrip" mesh,
 * hidden until the customer adds a strip.
 *
 * The artist's UVs mirror the two sides over each other, which would print lettering
 * backwards on one side. So the mesh gets its own: across goes left to right around the
 * curve as seen from the front, and up keeps the artist's across-the-band direction.
 */

const CANVAS_HEIGHT = 256
const MAX_CANVAS_WIDTH = 4096

interface StripWrap {
  uvs: Float32Array
  /** Width of the unwrapped band over its height, so lettering isn't stretched. */
  aspect: number
}

function wrapStrip(mesh: Mesh, root: Object3D): StripWrap | null {
  const position = mesh.geometry.getAttribute("position")
  if (!position) return null
  root.updateMatrixWorld(true)
  const toRoot = new Matrix4().copy(root.matrixWorld).invert().multiply(mesh.matrixWorld)

  const points: Vector3[] = []
  const min = new Vector3(Infinity, Infinity, Infinity)
  const max = new Vector3(-Infinity, -Infinity, -Infinity)
  for (let index = 0; index < position.count; index++) {
    const point = new Vector3().fromBufferAttribute(position, index).applyMatrix4(toRoot)
    points.push(point)
    min.min(point)
    max.max(point)
  }

  // The band curves around the front of the head: unroll it around an axis behind it.
  const centreX = (min.x + max.x) / 2
  const axisZ = min.z
  const angles = points.map((point) => Math.atan2(point.x - centreX, point.z - axisZ))
  const minAngle = Math.min(...angles)
  const angleSpan = Math.max(Math.max(...angles) - minAngle, 1e-3)
  const radius = points.reduce((sum, point) => sum + Math.hypot(point.x - centreX, point.z - axisZ), 0) / points.length

  // Down the band: measured from its real top edge to its real bottom edge at each point along
  // it. (The model's own UV squashes and bends near the front, so straight artwork sagged in a V.)
  // Each edge is traced through its own vertices, the highest / lowest among close neighbours
  // along the band, and followed exactly between them.
  const order = angles.map((_, index) => index).sort((a, b) => angles[a] - angles[b])
  const window = angleSpan * 0.01
  const traceEdge = (beyond: (other: number, own: number) => boolean) => {
    const edge: [number, number][] = []
    let first = 0
    order.forEach((index) => {
      while (angles[order[first]] < angles[index] - window) first++
      for (let other = first; other < order.length && angles[order[other]] <= angles[index] + window; other++) {
        if (beyond(points[order[other]].y, points[index].y)) return
      }
      if (!edge.length || edge[edge.length - 1][0] !== angles[index]) edge.push([angles[index], points[index].y])
    })
    return edge
  }
  const edgeAt = (edge: [number, number][], angle: number) => {
    if (angle <= edge[0][0]) return edge[0][1]
    for (let at = 1; at < edge.length; at++) {
      const [a1, y1] = edge[at]
      if (angle <= a1) {
        const [a0, y0] = edge[at - 1]
        return a1 - a0 < 1e-9 ? y1 : y0 + ((y1 - y0) * (angle - a0)) / (a1 - a0)
      }
    }
    return edge[edge.length - 1][1]
  }
  const topEdge = traceEdge((other, own) => other > own)
  const bottomEdge = traceEdge((other, own) => other < own)

  const uvs = new Float32Array(position.count * 2)
  points.forEach((point, index) => {
    const top = edgeAt(topEdge, angles[index])
    const bottom = edgeAt(bottomEdge, angles[index])
    const down = top - bottom > 1e-6 ? Math.min(1, Math.max(0, (top - point.y) / (top - bottom))) : 0
    uvs[index * 2] = (angles[index] - minAngle) / angleSpan
    // The canvas is drawn top-down; textures read bottom-up.
    uvs[index * 2 + 1] = 1 - down
  })

  // How tall the band really is: its depth up the visor at the very front.
  const front = points.filter((point) => Math.abs(point.x - centreX) < (max.x - min.x) * 0.05)
  const frontHeight = Math.hypot(
    Math.max(...front.map((point) => point.y)) - Math.min(...front.map((point) => point.y)),
    Math.max(...front.map((point) => point.z)) - Math.min(...front.map((point) => point.z)),
  )
  return { uvs, aspect: (radius * angleSpan) / Math.max(frontHeight, 1e-3) }
}

/** The band itself: its colour, a brushed silver for chrome, or its film tiled along it. */
async function paintBand(context: CanvasRenderingContext2D, width: number, strip: VisorStrip, filmUrl: string | null) {
  context.fillStyle = strip.kind === "chrome" ? "#d6d9dc" : strip.colour
  context.fillRect(0, 0, width, CANVAS_HEIGHT)
  if ((strip.kind !== "film" && !strip.holographic) || !filmUrl) return
  // Holographic film is tinted by the sticker's colour underneath it.
  if (strip.holographic && strip.kind !== "film") context.globalCompositeOperation = "multiply"
  const image = new Image()
  image.src = filmUrl
  await image.decode()
  const pattern = context.createPattern(image, "repeat")
  if (!pattern) return
  // One tile per band height, the same scale as films on the shell.
  const scale = CANVAS_HEIGHT / image.height
  pattern.setTransform(new DOMMatrix().scale(scale, scale))
  context.fillStyle = pattern
  context.fillRect(0, 0, width, CANVAS_HEIGHT)
  context.globalCompositeOperation = "source-over"
}

/** Holographic film over a printed design: the foil, tinted by the print underneath. */
async function shimmer(context: CanvasRenderingContext2D, width: number, filmUrl: string) {
  const image = new Image()
  image.src = filmUrl
  await image.decode().catch(() => undefined)
  if (!image.naturalWidth) return
  const pattern = context.createPattern(image, "repeat")
  if (!pattern) return
  const scale = CANVAS_HEIGHT / image.height
  pattern.setTransform(new DOMMatrix().scale(scale, scale))
  context.globalCompositeOperation = "multiply"
  context.fillStyle = pattern
  context.fillRect(0, 0, width, CANVAS_HEIGHT)
  context.globalCompositeOperation = "source-over"
}

/** The band and its lettering. */
async function drawStrip(strip: VisorStrip, aspect: number, filmUrl: string | null, model: string | undefined): Promise<CanvasTexture> {
  const canvas = document.createElement("canvas")
  canvas.width = Math.min(Math.round(CANVAS_HEIGHT * aspect), MAX_CANVAS_WIDTH)
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext("2d")!

  if (strip.branded) {
    // The Lucas Racing sticker in its own shape, across the front of the visor. The band
    // is about twice as long as the sticker, so it keeps (nearly) its own proportions and
    // the rest of the band is left clear rather than stretching the artwork.
    const sticker = new Image()
    sticker.src = brandedStickerUrl(model)
    await sticker.decode().catch(() => undefined)
    if (sticker.naturalWidth) {
      const width = shareOf(canvas.width, (sticker.naturalWidth / sticker.naturalHeight) * STICKER_STRETCH, aspect)
      context.drawImage(sticker, (canvas.width - width) / 2, 0, width, CANVAS_HEIGHT)
    }
    return finish(canvas)
  }

  const design = findStickerDesign(strip.design)
  if (design?.shaped) {
    // A cut-out sticker: laid along the visor's top edge at its own proportions, the
    // rest of the band left clear, like the Lucas Racing sticker.
    const image = new Image()
    image.src = await recolouredSticker(design, strip.designColours, model)
    await image.decode().catch(() => undefined)
    if (!image.naturalWidth) return finish(canvas)
    const flat = straighten(image)
    const width = shareOf(canvas.width, (flat.canvas.width / flat.canvas.height) * STICKER_STRETCH, aspect)
    const left = (canvas.width - width) / 2
    context.drawImage(flat.canvas, left, 0, width, CANVAS_HEIGHT)
    if (strip.holographic && filmUrl) {
      await shimmer(context, canvas.width, filmUrl)
      // The foil only where the sticker is.
      context.globalCompositeOperation = "destination-in"
      context.drawImage(flat.canvas, left, 0, width, CANVAS_HEIGHT)
      context.globalCompositeOperation = "source-over"
    }
    const text = strip.text.trim()
    if (text) await letter(context, strip, text, canvas.width / 2, CANVAS_HEIGHT * flat.bandDepth * 0.5, CANVAS_HEIGHT * flat.bandDepth * 0.62, width * 0.42)
    return finish(canvas)
  }
  if (design) {
    // A ready-made design fills the whole strip, in the customer's colours.
    const image = new Image()
    image.src = await recolouredSticker(design, strip.designColours, model)
    await image.decode().catch(() => undefined)
    if (image.naturalWidth) context.drawImage(image, 0, 0, canvas.width, canvas.height)
    if (strip.holographic && filmUrl) await shimmer(context, canvas.width, filmUrl)
  } else {
    await paintBand(context, canvas.width, strip, filmUrl)
    // Cut to the helmet's sticker template (the Lucas Racing sticker's outline), like every
    // other sticker, with the lettering centred inside it.
    const outline = new Image()
    outline.src = brandedStickerUrl(model)
    await outline.decode().catch(() => undefined)
    if (outline.naturalWidth) {
      const flat = straighten(outline)
      const width = shareOf(canvas.width, (outline.naturalWidth / outline.naturalHeight) * STICKER_STRETCH, aspect)
      context.globalCompositeOperation = "destination-in"
      context.drawImage(outline, (canvas.width - width) / 2, 0, width, CANVAS_HEIGHT)
      context.globalCompositeOperation = "source-over"
      const text = strip.text.trim()
      if (text) await letter(context, strip, text, canvas.width / 2, CANVAS_HEIGHT * flat.bandDepth * 0.5, CANVAS_HEIGHT * flat.bandDepth * 0.62, width * 0.42)
      return finish(canvas)
    }
  }

  const text = strip.text.trim()
  // Kept on the front of the visor, clear of the curve at the sides.
  if (text) await letter(context, strip, text, canvas.width / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.62, canvas.width * 0.5)

  return finish(canvas)
}

/** The customer's lettering, centred at (x, y), shrunk to fit maxWidth. */
async function letter(context: CanvasRenderingContext2D, strip: VisorStrip, text: string, x: number, y: number, size: number, maxWidth: number) {
  const font = canvasFont(strip.font, size)
  if (document.fonts) await document.fonts.load(font, text).catch(() => undefined)
  context.font = font
  const width = context.measureText(text).width
  if (width > maxWidth) {
    size *= maxWidth / width
    context.font = canvasFont(strip.font, size)
  }
  context.fillStyle = strip.textColour ?? "#ffffff"
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, x, y + size * 0.04)
}


/**
 * A cut-out design is drawn as a flat view of the visor: its top edge curves up towards
 * the ends. The 3D band already follows the visor's top edge, so each column of the
 * artwork is moved up until its top edge is straight; otherwise the ends would sit
 * above the band and be cut off. Also gives how deep the main band is at the centre
 * (above the gap to its thin lower strip), as a share of the whole, for the lettering.
 */
function straighten(image: HTMLImageElement): { canvas: HTMLCanvasElement; bandDepth: number } {
  const scale = 2
  const source = document.createElement("canvas")
  source.width = image.naturalWidth * scale
  source.height = image.naturalHeight * scale
  const sourceContext = source.getContext("2d", { willReadFrequently: true })!
  sourceContext.drawImage(image, 0, 0, source.width, source.height)
  const { data } = sourceContext.getImageData(0, 0, source.width, source.height)
  const solid = (x: number, y: number) => data[(y * source.width + x) * 4 + 3] > 8

  const columns: { x: number; top: number; bottom: number }[] = []
  for (let x = 0; x < source.width; x++) {
    let top = -1
    let bottom = -1
    for (let y = 0; y < source.height; y++) {
      if (!solid(x, y)) continue
      if (top < 0) top = y
      bottom = y
    }
    if (top >= 0) columns.push({ x, top, bottom })
  }
  if (!columns.length) return { canvas: source, bandDepth: 1 }

  const height = Math.max(...columns.map((column) => column.bottom - column.top + 1))
  const first = columns[0].x
  const flat = document.createElement("canvas")
  flat.width = columns[columns.length - 1].x - first + 1
  flat.height = height
  const flatContext = flat.getContext("2d")!
  for (const { x, top, bottom } of columns) flatContext.drawImage(source, x, top, 1, bottom - top + 1, x - first, 0, 1, bottom - top + 1)

  // Down the middle column: the main band ends where the first clear row is.
  const middle = columns[Math.floor(columns.length / 2)]
  let bandEnd = middle.top
  while (bandEnd <= middle.bottom && solid(middle.x, bandEnd)) bandEnd++
  return { canvas: flat, bandDepth: Math.min(1, (bandEnd - middle.top) / height) }
}

function finish(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = true
  texture.anisotropy = 8
  return texture
}

/**
 * How much wider than its artwork a sticker is drawn, so it reaches round the visor like
 * the real one. The Lucas Racing sticker and the designs share one template size per
 * helmet, so they're drawn alike.
 */
const STICKER_STRETCH = 1.15

/**
 * A sticker's width on the band's canvas: its share of the band's length. Long bands cap
 * the canvas and squeeze it along the band, so sizing by share keeps true proportions.
 */
function shareOf(canvasWidth: number, stickerAspect: number, bandAspect: number) {
  return canvasWidth * Math.min(1, stickerAspect / bandAspect)
}

/** The Lucas Racing sticker's second piece: lucasracing.co.uk along the bottom of the visor. */
const BRANDED_LOWER_URL = "/stickers/lucas-racing-visor-lower.webp?v=1"
const LOWER_BAND = "VisorStripLower"

function findStrips(root: Object3D): Mesh[] {
  const strips: Mesh[] = []
  root.traverse((node) => {
    const mesh = node as Mesh
    if (mesh.isMesh && (mesh.name === "VisorStrip" || mesh.name === LOWER_BAND)) strips.push(mesh)
  })
  return strips
}

const lowerBands = new Map<string, Promise<{ aspect: number; positions: number[]; uvs: number[]; indices: number[] } | null>>()

/**
 * Adds the band along the bottom of the visor (scripts/prepare-visor-lower-band.mjs, saved
 * beside the model as <model>-visor-lower.json) to the helmet, hidden until the Lucas
 * Racing sticker is on. True once it's there; false for a helmet without one.
 */
export async function addLowerBand(root: Object3D, modelUrl: string): Promise<boolean> {
  if (root.getObjectByName(LOWER_BAND)) return true
  const url = modelUrl.replace(/\.glb(\?.*)?$/, "-visor-lower.json$1")
  if (url === modelUrl) return false
  let pending = lowerBands.get(url)
  if (!pending) {
    pending = fetch(url)
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
    lowerBands.set(url, pending)
  }
  const band = await pending
  if (!band || root.getObjectByName(LOWER_BAND)) return Boolean(band)
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(band.positions), 3))
  // Laid out by the script (it knows the band's grid), so wrapStrip() leaves it alone.
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(band.uvs), 2))
  geometry.setIndex(band.indices)
  geometry.computeVertexNormals()
  // Its points are in the model's scene space, which is the helmet root's own.
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ side: DoubleSide }))
  mesh.name = LOWER_BAND
  mesh.userData.stripAspect = band.aspect
  mesh.visible = false
  root.add(mesh)
  return true
}

/**
 * The bottom strip, part of every visor sticker: lucasracing.co.uk on the Lucas Racing
 * sticker; on the others the same strip shape in the sticker's main colour, with the
 * customer's bottom text (up to 25 characters) in their lettering.
 */
async function drawLower(aspect: number, strip: VisorStrip): Promise<CanvasTexture> {
  const canvas = document.createElement("canvas")
  canvas.width = Math.min(Math.round(CANVAS_HEIGHT * aspect), MAX_CANVAS_WIDTH)
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext("2d")!
  const image = new Image()
  image.src = BRANDED_LOWER_URL
  await image.decode().catch(() => undefined)
  if (!image.naturalWidth) return finish(canvas)
  const width = shareOf(canvas.width, image.naturalWidth / image.naturalHeight, aspect)
  const left = (canvas.width - width) / 2
  context.drawImage(image, left, 0, width, CANVAS_HEIGHT)
  if (strip.branded) return finish(canvas)

  // The strip's shape, filled with the sticker's main colour.
  const design = findStickerDesign(strip.design)
  const main = design ? (stickerColours(design, strip.designColours)[design.parts[0]?.key ?? ""] ?? strip.colour) : strip.colour
  context.globalCompositeOperation = "source-in"
  context.fillStyle = main
  context.fillRect(0, 0, canvas.width, CANVAS_HEIGHT)
  context.globalCompositeOperation = "source-over"
  const text = (strip.bottomText ?? "").trim()
  if (text) await letter(context, strip, text, canvas.width / 2, CANVAS_HEIGHT * 0.5, CANVAS_HEIGHT * 0.6, width * 0.78)
  return finish(canvas)
}

function clearArtwork(mesh: Mesh) {
  const material = mesh.material as MeshStandardMaterial
  material.map?.dispose()
  material.map = null
}

/** Frees the strip's canvas when the helmet goes away. */
export function removeVisorStrips(root: Object3D) {
  findStrips(root).forEach(clearArtwork)
}

/** Prints the strip on the visor, or takes it off with null. */
export async function updateVisorStrip(root: Object3D, strip: VisorStrip | null, filmUrl: string | null, isCancelled: () => boolean, model?: string) {
  for (const mesh of findStrips(root)) {
    // The bottom strip is part of every sticker (the band along the bottom of the visor).
    const lower = mesh.name === LOWER_BAND
    if (!strip?.enabled) {
      mesh.visible = false
      continue
    }
    if (!mesh.userData.stripAspect) {
      const wrap = wrapStrip(mesh, root)
      if (!wrap) continue
      // The geometry is shared with the loader's cache, so the new UVs go on a copy.
      mesh.geometry = mesh.geometry.clone()
      mesh.geometry.setAttribute("uv", new BufferAttribute(wrap.uvs, 2))
      mesh.userData.stripAspect = wrap.aspect
    }
    const texture = lower ? await drawLower(mesh.userData.stripAspect as number, strip) : await drawStrip(strip, mesh.userData.stripAspect as number, filmUrl, model)
    if (isCancelled()) {
      texture.dispose()
      return
    }
    clearArtwork(mesh)
    const material = mesh.material as MeshStandardMaterial
    material.map = texture
    material.color.set("#ffffff")
    // Drawn with the see-through things, after the visor glass, so the glass never cuts it.
    // The branded sticker has a shaped outline: the clear parts of its artwork show the visor.
    material.transparent = true
    material.opacity = 1
    // Cut-out shapes (every sticker but a full-strip design like Blade) show the visor around them.
    const design = findStickerDesign(strip.design)
    material.alphaTest = lower || strip.branded || !design || design.shaped ? 0.5 : 0
    mesh.renderOrder = 1
    material.metalness = strip.branded ? 0.25 : strip.kind === "chrome" ? 1 : strip.kind === "metallic" || strip.holographic ? 0.65 : 0
    material.roughness = strip.kind === "chrome" ? 0.1 : strip.kind === "metallic" ? 0.28 : 0.35
    material.needsUpdate = true
    mesh.visible = true
  }
}
