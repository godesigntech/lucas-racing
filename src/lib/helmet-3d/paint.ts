import type { HelmetLook } from "@/types/helmet"

import { filmTile } from "./films"
import { mirroredLayout } from "./layouts"
import { NUMBER_SPOT, TEX_H, TEX_W } from "./uv-mapping"

export interface HelmetTextures {
  /** Albedo in helmet texture space. */
  color: HTMLCanvasElement
  /** Material map: green = roughness, blue = metalness (three.js convention). */
  material: HTMLCanvasElement
}

const ROUGHNESS = { gloss: 0.22, matte: 0.68, chrome: 0.05 } as const
const materialStyle = (roughness: number, metal = 0) =>
  `rgb(0,${Math.round(roughness * 255)},${Math.round(metal * 255)})`

function canvas() {
  const c = document.createElement("canvas")
  c.width = TEX_W
  c.height = TEX_H
  return c
}

function polygon(points: [number, number][]): Path2D {
  const path = new Path2D()
  points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)))
  path.closePath()
  return path
}

function polyline(points: [number, number][]): Path2D {
  const path = new Path2D()
  points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)))
  return path
}

/** The site's display font (next/font renames the family, so read it from the CSS variable). */
function displayFontFamily(): string {
  const family = getComputedStyle(document.body).getPropertyValue("--font-barlow").trim()
  return `${family || '"Barlow Condensed"'}, "Arial Narrow", Arial, sans-serif`
}

/**
 * Paints the shell: base, layout graphic (solid or film), accents, number and name.
 * Visor, rubbers and plastics are separate zones with their own materials.
 * Async because films load as images and fonts may still be loading.
 */
export async function paintHelmetLook(look: HelmetLook): Promise<HelmetTextures> {
  await document.fonts.ready
  const color = canvas()
  const material = canvas()
  const ctx = color.getContext("2d")!
  const mat = material.getContext("2d")!
  const shellRoughness = ROUGHNESS[look.finish]

  // Base shell. Chrome is a metallic base under all graphics.
  ctx.fillStyle = look.finish === "chrome" ? "#e4e7eb" : look.base
  ctx.fillRect(0, 0, TEX_W, TEX_H)
  mat.fillStyle = look.finish === "chrome" ? materialStyle(ROUGHNESS.chrome, 1) : materialStyle(shellRoughness)
  mat.fillRect(0, 0, TEX_W, TEX_H)

  // Graphic: solid colour or a film tinted with the graphic colour.
  let graphicFill: string | CanvasPattern = look.graphic
  if (look.film !== "none") {
    const tile = await filmTile(look.film, look.graphic)
    const pattern = ctx.createPattern(tile.canvas, "repeat")
    if (pattern) {
      pattern.setTransform(new DOMMatrix().rotate(tile.rotate))
      graphicFill = pattern
    }
  }
  const graphicRoughness = look.finish === "matte" ? ROUGHNESS.matte : ROUGHNESS.gloss
  const layout = mirroredLayout(look.layout)
  for (const shape of layout.fills) {
    const path = polygon(shape)
    ctx.fillStyle = graphicFill
    ctx.fill(path)
    mat.fillStyle = materialStyle(graphicRoughness)
    mat.fill(path)
  }
  ctx.lineCap = mat.lineCap = "round"
  ctx.lineJoin = mat.lineJoin = "round"
  for (const accent of layout.accents) {
    const path = polyline(accent.points)
    ctx.strokeStyle = look.accent
    ctx.lineWidth = mat.lineWidth = accent.width
    ctx.stroke(path)
    mat.strokeStyle = materialStyle(graphicRoughness)
    mat.stroke(path)
  }

  // Race number and name on both sides, behind the visor pivots.
  for (const u of [NUMBER_SPOT.u, 1 - NUMBER_SPOT.u]) {
    const x = u * TEX_W
    if (look.number) {
      drawText(ctx, mat, look.number, x, NUMBER_SPOT.v * TEX_H, 170, look.accent, look.graphic, graphicRoughness)
    }
    if (look.name) {
      drawText(ctx, mat, look.name.toUpperCase(), x, (NUMBER_SPOT.v + 0.14) * TEX_H, 56, look.graphic, null, graphicRoughness, 10)
    }
  }

  return { color, material }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  mat: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  outline: string | null,
  roughness: number,
  letterSpacing = 0,
) {
  const font = `800 ${size}px ${displayFontFamily()}`
  for (const c of [ctx, mat]) {
    c.save()
    c.font = font
    c.textAlign = "center"
    c.textBaseline = "middle"
    c.letterSpacing = `${letterSpacing}px`
    if (outline) {
      c.lineWidth = size * 0.1
      c.strokeStyle = c === ctx ? outline : materialStyle(roughness)
      c.strokeText(text, x, y)
    }
    c.fillStyle = c === ctx ? fill : materialStyle(roughness)
    c.fillText(text, x, y)
    c.restore()
  }
}
