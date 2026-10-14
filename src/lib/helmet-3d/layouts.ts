import type { HelmetLayout } from "@/types/helmet"

import { TEX_H, TEX_W } from "./uv-mapping"

// Each layout is drawn on the left half of the texture (rear x=0 → face x=1024)
// and mirrored onto the right half, so both sides of the helmet match.

type Point = [number, number]

export interface UvLayout {
  /** Closed shapes filled with the graphic colour or film. */
  fills: Point[][]
  /** Open polylines stroked in the accent colour. */
  accents: { points: Point[]; width: number }[]
}

const mirror = (points: Point[]): Point[] => points.map(([x, y]) => [TEX_W - x, y])

/** Fills and accents for both sides of the shell. */
export function mirroredLayout(layout: HelmetLayout): UvLayout {
  const half = LAYOUTS[layout]
  return {
    fills: [...half.fills, ...half.fills.map(mirror)],
    accents: [...half.accents, ...half.accents.map((a) => ({ ...a, points: mirror(a.points) }))],
  }
}

/**
 * A stripe running front-to-back over the crown at a fixed lateral offset.
 * On a sphere a constant offset widens in u towards the crown, so the edge is
 * computed per row instead of drawing a straight band in texture space.
 */
function crownStripe(offset0: number, offset1: number, vEnd: number, from: "face" | "rear"): Point[] {
  const centre = from === "face" ? TEX_W / 2 : 0
  const sign = from === "face" ? -1 : 1
  const edge = (offset: number) => {
    const points: Point[] = []
    for (let step = 1; step <= 24; step++) {
      const v = (step / 24) * vEnd
      const sinTheta = Math.max(0.12, Math.sin(v * Math.PI * 0.82))
      const du = Math.asin(Math.min(1, offset / sinTheta)) / (2 * Math.PI)
      points.push([centre + sign * du * TEX_W, v * TEX_H])
    }
    return points
  }
  return [[centre, -4], ...edge(offset0), ...edge(offset1).reverse()]
}

const LAYOUTS: Record<HelmetLayout, UvLayout> = {
  apex: {
    fills: [
      [[1030, 300], [1030, 420], [820, 410], [600, 450], [380, 570], [200, 760], [120, 1030], [-10, 1030], [-10, 780], [140, 560], [380, 400], [640, 320], [860, 300]],
    ],
    accents: [{ points: [[1030, 448], [820, 438], [610, 476], [400, 594], [226, 780], [150, 1030]], width: 14 }],
  },
  twin: {
    fills: [crownStripe(0.05, 0.16, 0.54, "face"), crownStripe(0.05, 0.16, 0.92, "rear")],
    accents: [],
  },
  split: {
    fills: [[[-10, -10], [380, -10], [340, 300], [360, 620], [430, 1034], [-10, 1034]]],
    accents: [{ points: [[380, -10], [340, 300], [360, 620], [430, 1034]], width: 14 }],
  },
  shard: {
    fills: [
      [[260, 330], [620, 250], [560, 330], [290, 420]],
      [[180, 560], [640, 420], [690, 480], [230, 660]],
      [[270, 760], [600, 640], [630, 690], [320, 820]],
      [[680, 280], [800, 250], [740, 320]],
    ],
    accents: [{ points: [[180, 560], [640, 420]], width: 8 }],
  },
  halo: {
    fills: [[[-10, 400], [1034, 400], [1034, 500], [-10, 500]]],
    accents: [
      { points: [[-10, 382], [1034, 382]], width: 8 },
      { points: [[-10, 518], [1034, 518]], width: 8 },
    ],
  },
  flow: {
    fills: [[[-10, 800], [200, 740], [420, 830], [640, 760], [860, 790], [1034, 760], [1034, 1034], [-10, 1034]]],
    accents: [{ points: [[-10, 776], [200, 716], [420, 806], [640, 736], [860, 766], [1034, 736]], width: 12 }],
  },
  blank: { fills: [], accents: [] },
}
