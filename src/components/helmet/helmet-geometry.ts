import type { HelmetLayout } from "@/types/helmet"

// Side profile of a full-face kart helmet facing right, in a 480 × 360 space.
// Concept geometry for illustrations only; the 3D builder uses real models.

export const SHELL_PATH =
  "M96 262 C70 200 84 120 150 82 C205 50 300 46 360 84 C396 108 420 142 425 178 C430 216 424 250 404 272 C393 285 370 292 345 290 L250 284 C200 282 150 280 122 276 C106 273 98 269 96 262 Z"

export const BASE_EDGE_PATH =
  "M96 262 C98 269 106 273 122 276 C150 280 200 282 250 284 L345 290 C370 292 393 285 404 272"

export const VISOR_PATH =
  "M292 140 C330 124 392 122 420 138 L430 200 C400 214 336 218 300 206 C286 190 284 160 292 140 Z"

export const SPOILER_PATH = "M134 96 L98 90 C86 89 82 101 91 107 L132 126 Z"

export const TOP_VENT_PATH = "M300 62 C320 57 345 61 357 72 L351 80 C336 72 318 70 302 72 Z"

interface LayoutShapes {
  /** Filled graphic areas (take the film or graphic colour). */
  fills: string[]
  /** Accent pinstripes, drawn as strokes. */
  strokes: { d: string; width: number }[]
  /** Bands drawn as thick strokes in the graphic colour. */
  bands?: { d: string; width: number }[]
  /** Dashed guide lines (used by the blank canvas layout). */
  guides?: string[]
}

export const LAYOUTS: Record<HelmetLayout, LayoutShapes> = {
  apex: {
    fills: [
      "M168 74 C250 52 330 62 372 96 L348 122 C290 92 220 104 180 150 C150 185 130 225 124 290 L84 290 C86 200 112 120 168 74 Z",
    ],
    strokes: [{ d: "M356 134 C298 104 230 116 192 160 C164 194 148 232 144 292", width: 5 }],
  },
  twin: {
    fills: [],
    bands: [
      { d: "M398 128 C342 58 200 46 112 148 C98 168 90 200 92 250", width: 26 },
      { d: "M382 152 C332 92 212 84 136 166 C122 186 116 212 116 260", width: 9 },
    ],
    strokes: [],
  },
  split: {
    fills: ["M0 0 L238 0 C214 110 222 200 262 360 L0 360 Z"],
    strokes: [{ d: "M238 0 C214 110 222 200 262 360", width: 6 }],
  },
  shard: {
    fills: [
      "M150 118 L272 90 L252 118 L160 150 Z",
      "M118 192 L270 140 L288 160 L138 230 Z",
      "M152 252 L254 210 L266 228 L170 272 Z",
      "M284 98 L334 84 L312 110 Z",
    ],
    strokes: [{ d: "M118 192 L270 140", width: 3 }],
  },
  halo: {
    fills: ["M60 150 C150 128 240 118 300 128 L300 170 C240 162 150 172 60 198 Z"],
    strokes: [
      { d: "M60 140 C150 118 240 108 300 118", width: 3 },
      { d: "M60 208 C150 182 240 172 300 180", width: 3 },
    ],
  },
  flow: {
    fills: ["M70 238 C150 186 212 268 292 222 C334 198 384 204 446 242 L446 320 L70 320 Z"],
    strokes: [{ d: "M70 226 C150 174 212 256 292 210 C334 186 384 192 446 230", width: 4 }],
  },
  blank: {
    fills: [],
    strokes: [],
    guides: [
      "M110 150 C180 90 300 80 380 120",
      "M100 210 C190 160 300 150 400 190",
      "M120 262 C200 230 300 228 400 250",
    ],
  },
}

export const VIEW_BOXES = {
  full: "48 36 400 286",
  crown: "120 40 250 150",
  visor: "262 96 190 140",
  decal: "120 140 220 150",
} as const

export type HelmetView = keyof typeof VIEW_BOXES
