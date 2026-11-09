import { BufferAttribute, CanvasTexture, Matrix4, type Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3, type Object3D } from "three"

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
  const uv = mesh.geometry.getAttribute("uv")
  if (!position || !uv) return null
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

  // Across the band: the artist's U, turned so that up on the helmet is up on the canvas.
  let minU = Infinity
  let maxU = -Infinity
  for (let index = 0; index < position.count; index++) {
    minU = Math.min(minU, uv.getX(index))
    maxU = Math.max(maxU, uv.getX(index))
  }
  const uSpan = Math.max(maxU - minU, 1e-3)
  const centreU = (minU + maxU) / 2
  let upward = 0
  points.forEach((point, index) => {
    upward += (uv.getX(index) - centreU) * (point.y - (min.y + max.y) / 2)
  })

  const uvs = new Float32Array(position.count * 2)
  points.forEach((_, index) => {
    const across = (uv.getX(index) - minU) / uSpan
    uvs[index * 2] = (angles[index] - minAngle) / angleSpan
    uvs[index * 2 + 1] = upward >= 0 ? across : 1 - across
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

/** The band and its lettering. */
async function drawStrip(strip: VisorStrip, aspect: number, filmUrl: string | null): Promise<CanvasTexture> {
  const canvas = document.createElement("canvas")
  canvas.width = Math.min(Math.round(CANVAS_HEIGHT * aspect), MAX_CANVAS_WIDTH)
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext("2d")!

  if (strip.branded) {
    // The Lucas Racing sticker in its own shape, across the front of the visor. The band
    // is about twice as long as the sticker, so it keeps (nearly) its own proportions and
    // the rest of the band is left clear rather than stretching the artwork.
    const sticker = new Image()
    sticker.src = BRANDED_STICKER_URL
    await sticker.decode().catch(() => undefined)
    if (sticker.naturalWidth) {
      const width = Math.min(canvas.width, CANVAS_HEIGHT * (sticker.naturalWidth / sticker.naturalHeight) * STICKER_STRETCH)
      context.drawImage(sticker, (canvas.width - width) / 2, 0, width, CANVAS_HEIGHT)
    }
    return finish(canvas)
  }

  await paintBand(context, canvas.width, strip, filmUrl)

  const text = strip.text.trim()
  if (text) {
    let size = CANVAS_HEIGHT * 0.62
    const font = canvasFont(strip.font, size)
    if (document.fonts) await document.fonts.load(font, text).catch(() => undefined)
    context.font = font
    // Keep the lettering on the front of the visor, clear of the curve at the sides.
    const maxWidth = canvas.width * 0.5
    const width = context.measureText(text).width
    if (width > maxWidth) {
      size *= maxWidth / width
      context.font = canvasFont(strip.font, size)
    }
    context.fillStyle = strip.textColour ?? "#ffffff"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(text, canvas.width / 2, CANVAS_HEIGHT / 2 + size * 0.04)
  }

  return finish(canvas)
}

function finish(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = true
  texture.anisotropy = 8
  return texture
}

/** The client's visor sticker, cut out of its background. */
const BRANDED_STICKER_URL = "/stickers/lucas-racing-visor.webp?v=straight-1"
/** How much wider than its artwork the sticker is drawn, so it reaches further round the visor. */
const STICKER_STRETCH = 1.3

function findStrips(root: Object3D): Mesh[] {
  const strips: Mesh[] = []
  root.traverse((node) => {
    const mesh = node as Mesh
    if (mesh.isMesh && mesh.name === "VisorStrip") strips.push(mesh)
  })
  return strips
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
export async function updateVisorStrip(root: Object3D, strip: VisorStrip | null, filmUrl: string | null, isCancelled: () => boolean) {
  for (const mesh of findStrips(root)) {
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
    const texture = await drawStrip(strip, mesh.userData.stripAspect as number, filmUrl)
    if (isCancelled()) {
      texture.dispose()
      return
    }
    clearArtwork(mesh)
    const material = mesh.material as MeshStandardMaterial
    material.map = texture
    material.color.set("#ffffff")
    // The branded sticker has a shaped outline: the clear parts of its artwork show the visor.
    material.transparent = Boolean(strip.branded)
    material.alphaTest = strip.branded ? 0.5 : 0
    material.metalness = strip.branded ? 0.25 : strip.kind === "chrome" ? 1 : strip.kind === "metallic" || strip.holographic ? 0.65 : 0
    material.roughness = strip.kind === "chrome" ? 0.1 : strip.kind === "metallic" ? 0.28 : 0.35
    material.needsUpdate = true
    mesh.visible = true
  }
}
