import { CanvasTexture, Float32BufferAttribute, Matrix4, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3, type Object3D } from "three"

import type { VisorStrip } from "@/types/configurator"

import { canvasFont } from "./helmet-fonts"

/**
 * Step 13's printed band across the top of the visor.
 *
 * The visor's own UVs aren't laid out for printing, so the strip is drawn on a copy of
 * the visor mesh with UVs wrapped around its curve: across goes left to right as the
 * rider sees it from the front, up goes bottom to top.
 */

const OVERLAY = "VisorStripOverlay"
/** Share of the visor's height the band covers, measured from the top edge. */
const BAND = 0.2
const CANVAS_HEIGHT = 512

interface VisorWrap {
  uvs: Float32Array
  /** Width of the unwrapped visor over its height, so lettering isn't stretched. */
  aspect: number
}

/** Cylindrical UVs around the visor, in the helmet's own frame (front faces +Z). */
function wrapVisor(mesh: Mesh, root: Object3D): VisorWrap | null {
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

  // The visor curves around the front of the head: wrap it around an axis at the back of its box.
  const centreX = (min.x + max.x) / 2
  const axisZ = min.z
  const angles = points.map((point) => Math.atan2(point.x - centreX, point.z - axisZ))
  const minAngle = Math.min(...angles)
  const maxAngle = Math.max(...angles)
  const angleSpan = Math.max(maxAngle - minAngle, 1e-3)
  const height = Math.max(max.y - min.y, 1e-3)
  const radius = points.reduce((sum, point) => sum + Math.hypot(point.x - centreX, point.z - axisZ), 0) / points.length

  const uvs = new Float32Array(position.count * 2)
  points.forEach((point, index) => {
    uvs[index * 2] = (angles[index] - minAngle) / angleSpan
    uvs[index * 2 + 1] = (point.y - min.y) / height
  })
  return { uvs, aspect: Math.min(Math.max((radius * angleSpan) / height, 1), 8) }
}

/** The band and its lettering, on a canvas the shape of the unwrapped visor. */
async function drawStrip(strip: VisorStrip, aspect: number): Promise<CanvasTexture> {
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(CANVAS_HEIGHT * aspect)
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext("2d")!
  const bandHeight = CANVAS_HEIGHT * BAND

  context.fillStyle = strip.colour
  context.fillRect(0, 0, canvas.width, bandHeight)

  const text = strip.text.trim()
  if (text) {
    let size = bandHeight * 0.62
    let font = canvasFont(strip.font, size)
    if (typeof document !== "undefined" && document.fonts) await document.fonts.load(font, text).catch(() => undefined)
    context.font = font
    // Keep the lettering on the front of the visor, clear of the curve at the sides.
    const maxWidth = canvas.width * 0.5
    const width = context.measureText(text).width
    if (width > maxWidth) {
      size *= maxWidth / width
      font = canvasFont(strip.font, size)
      context.font = font
    }
    context.fillStyle = strip.textColour ?? "#ffffff"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(text, canvas.width / 2, bandHeight / 2 + size * 0.04)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function removeStrip(visor: Mesh) {
  const overlay = visor.getObjectByName(OVERLAY) as Mesh | undefined
  if (!overlay) return
  visor.remove(overlay)
  overlay.geometry.dispose()
  const material = overlay.material as MeshStandardMaterial
  material.map?.dispose()
  material.dispose()
}

function findVisors(root: Object3D): Mesh[] {
  const visors: Mesh[] = []
  root.traverse((node) => {
    const mesh = node as Mesh
    if (mesh.isMesh && mesh.name === "Visor") visors.push(mesh)
  })
  return visors
}

/** Frees the strip's canvas and geometry when the helmet goes away. */
export function removeVisorStrips(root: Object3D) {
  findVisors(root).forEach(removeStrip)
}

/** Prints the strip on every visor in the model, or takes it off with null. */
export async function updateVisorStrip(root: Object3D, strip: VisorStrip | null, isCancelled: () => boolean) {
  for (const visor of findVisors(root)) {
    if (!strip?.enabled) {
      removeStrip(visor)
      continue
    }
    const wrap = wrapVisor(visor, root)
    if (!wrap) continue
    const texture = await drawStrip(strip, wrap.aspect)
    if (isCancelled()) {
      texture.dispose()
      return
    }
    removeStrip(visor)
    const geometry = visor.geometry.clone()
    geometry.setAttribute("uv", new Float32BufferAttribute(wrap.uvs, 2))
    const overlay = new Mesh(
      geometry,
      new MeshStandardMaterial({
        map: texture,
        transparent: true,
        roughness: 0.35,
        metalness: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    )
    overlay.name = OVERLAY
    overlay.renderOrder = visor.renderOrder + 1
    visor.add(overlay)
  }
}
