import type { FilmId } from "@/types/helmet"

// Canvas tiles for the hydro-dip films. These mirror the SVG patterns in
// components/helmet/film-pattern.tsx so the 3D preview matches the cards.

type Film = Exclude<FilmId, "none">

/** Pattern markup at its natural size; `scale` sets how big it reads on the shell. */
const PATTERNS: Record<Film, { size: [number, number]; scale: number; rotate?: number; body: (tint: string) => string }> = {
  carbon: {
    size: [10, 10],
    scale: 1.6,
    rotate: 45,
    body: (tint) =>
      `<rect width="10" height="10" fill="#121413"/><rect width="5" height="5" fill="${tint}" opacity=".5"/><rect x="5" y="5" width="5" height="5" fill="${tint}" opacity=".5"/><rect width="5" height="2" fill="#fff" opacity=".12"/><rect x="5" y="5" width="5" height="2" fill="#fff" opacity=".12"/>`,
  },
  forged: {
    size: [44, 44],
    scale: 1.2,
    body: (tint) =>
      `<rect width="44" height="44" fill="#141615"/><path d="M0 4 L14 0 L18 10 L6 16 Z" fill="${tint}" opacity=".55"/><path d="M22 2 L38 6 L30 18 L20 12 Z" fill="#fff" opacity=".14"/><path d="M4 22 L18 18 L22 32 L8 34 Z" fill="#fff" opacity=".1"/><path d="M26 22 L42 20 L44 36 L30 38 Z" fill="${tint}" opacity=".4"/><path d="M12 36 L26 40 L20 44 L8 44 Z" fill="${tint}" opacity=".3"/><path d="M34 8 L44 12 L40 18 Z" fill="${tint}" opacity=".6"/>`,
  },
  hex: {
    size: [18, 31.2],
    scale: 1.4,
    body: (tint) =>
      `<rect width="18" height="31.2" fill="#121413"/><path d="M9 0 L18 5.2 L18 15.6 L9 20.8 L0 15.6 L0 5.2 Z M9 20.8 L9 31.2 M0 15.6 L0 26 M18 15.6 L18 26" fill="none" stroke="${tint}" stroke-width="1.6" opacity=".9"/>`,
  },
  camo: {
    size: [64, 64],
    scale: 2,
    body: (tint) =>
      `<rect width="64" height="64" fill="${tint}"/><path d="M2 10 C12 2, 24 6, 22 16 C20 26, 6 24, 2 10 Z" fill="#1d211c" opacity=".85"/><path d="M34 4 C48 0, 60 10, 54 20 C46 28, 32 18, 34 4 Z" fill="#4b5240" opacity=".8"/><path d="M10 36 C22 30, 34 40, 28 50 C20 60, 4 52, 10 36 Z" fill="#4b5240" opacity=".8"/><path d="M40 34 C52 30, 64 42, 58 54 C50 62, 36 50, 40 34 Z" fill="#1d211c" opacity=".85"/><path d="M26 24 C32 22, 36 28, 32 32 C26 34, 22 28, 26 24 Z" fill="#fff" opacity=".18"/>`,
  },
}

export interface FilmTile {
  canvas: HTMLCanvasElement
  /** Degrees to rotate the repeating pattern when it is painted. */
  rotate: number
}

const cache = new Map<string, Promise<FilmTile>>()

/** A seamless canvas tile of the film tinted with `tint` (carbon + blue = blue carbon). */
export function filmTile(film: Film, tint: string): Promise<FilmTile> {
  const key = `${film}|${tint}`
  const hit = cache.get(key)
  if (hit) return hit
  const spec = PATTERNS[film]
  const [w, h] = spec.size
  // Whole pattern repeats per tile so the tile itself repeats without seams.
  const tileW = Math.round(w * spec.scale * Math.max(1, Math.round(128 / (w * spec.scale))))
  const tileH = Math.round(h * spec.scale * Math.max(1, Math.round(128 / (h * spec.scale))))
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}">` +
    `<defs><pattern id="p" width="${w}" height="${h}" patternUnits="userSpaceOnUse" patternTransform="scale(${spec.scale})">${spec.body(tint)}</pattern></defs>` +
    `<rect width="${tileW}" height="${tileH}" fill="url(#p)"/></svg>`
  const promise = new Promise<FilmTile>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = tileW
      canvas.height = tileH
      canvas.getContext("2d")!.drawImage(image, 0, 0)
      resolve({ canvas, rotate: spec.rotate ?? 0 })
    }
    image.onerror = () => reject(new Error(`Could not draw the ${film} film`))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
  cache.set(key, promise)
  return promise
}
