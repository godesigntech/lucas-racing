import type { HelmetConfiguration, Placement } from "@/types/configurator"

/**
 * Where names, numbers, flags, logos and images sit in the decal atlas, which the 3D shader
 * projects onto the helmet from four directions. Kept free of three.js so the builder can
 * use it to turn a drag on the helmet into a placement without loading the 3D code.
 */

/** Where each placement is drawn in the decal atlas, and which way it faces. */
export const DECAL_FACES = ["sides", "front", "back", "top"] as const
export type DecalFace = (typeof DECAL_FACES)[number]

export const DECAL_SIZE = 1024
export const QUADRANT = DECAL_SIZE / 2

/** How far an item can be moved from its spot, as a share of the face it's drawn on. */
const OFFSET_SHARE = 0.5
export const OFFSET_RANGE = QUADRANT * OFFSET_SHARE

export const quadrantOrigin: Record<DecalFace, [number, number]> = {
  sides: [0, 0],
  front: [QUADRANT, 0],
  back: [0, QUADRANT],
  top: [QUADRANT, QUADRANT],
}

/** Where a placement lands in the atlas. Left and right share the "sides" quadrant. */
export function faceFor(placement: Placement): DecalFace {
  if (placement === "front") return "front"
  if (placement === "back") return "back"
  if (placement === "top") return "top"
  return "sides"
}

/** Where an item lands: its spot on the face (stacked under earlier items), plus the customer's nudge. */
export function itemCentre(face: DecalFace, slot: number, offsetX = 0, offsetY = 0): [number, number] {
  const [originX, originY] = quadrantOrigin[face]
  return [originX + QUADRANT / 2 + offsetX * OFFSET_RANGE, originY + QUADRANT * (0.42 + slot * 0.2) + offsetY * OFFSET_RANGE]
}

/** A spot on the helmet, as the 3D view reports a tap or drag: the face, and 0–1 across and down it. */
export interface HelmetSpot {
  face: DecalFace
  x: number
  y: number
  /** For the sides: which side was touched, as worn. */
  side: "left" | "right"
}

/** The nudge that puts an item's centre on a spot, given its place in the stack on that face. */
export function offsetsForSpot(slot: number, spot: HelmetSpot): { offsetX: number; offsetY: number } {
  const clamp = (value: number) => Math.round(Math.max(-1, Math.min(1, value)) * 100) / 100
  return { offsetX: clamp((spot.x - 0.5) / OFFSET_SHARE), offsetY: clamp((spot.y - 0.42 - slot * 0.2) / OFFSET_SHARE) }
}

/** The placement for a spot, if the item is allowed there: "sides" covers both sides when allowed. */
export function placementForSpot(spot: HelmetSpot, allowed: Placement[], current: Placement): Placement | null {
  if (spot.face !== "sides") return allowed.includes(spot.face) ? spot.face : null
  if (faceFor(current) === "sides" && allowed.includes(current)) return current
  if (allowed.includes("sides")) return "sides"
  return allowed.includes(spot.side) ? spot.side : null
}

/**
 * An item's place in the stack on its face, counted the way the atlas draws them: lettering
 * first, then logos and images, each in list order.
 */
export function decalSlot(config: HelmetConfiguration, list: "personalisation" | "logos", index: number, face: DecalFace): number {
  const texts = (config.personalisation ?? []).filter((item) => item.value.trim() !== "")
  if (list === "personalisation") {
    const before = (config.personalisation ?? []).slice(0, index).filter((item) => item.value.trim() !== "")
    return before.filter((item) => faceFor(item.position) === face).length
  }
  const textsHere = texts.filter((item) => faceFor(item.position) === face).length
  return textsHere + (config.logos ?? []).slice(0, index).filter((item) => faceFor(item.position) === face).length
}
