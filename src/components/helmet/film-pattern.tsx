import type { FilmId } from "@/types/helmet"

interface FilmPatternProps {
  id: string
  film: Exclude<FilmId, "none">
  /** Tint colour mixed into the film, e.g. carbon + blue = blue carbon. */
  tint: string
  scale?: number
}

/** SVG <pattern> approximating a hydro-dip film. Render inside <defs>. */
/** Per-film scale so each pattern repeats at a believable size on a helmet. */
const filmScale: Record<FilmPatternProps["film"], number> = {
  carbon: 1,
  forged: 0.6,
  hex: 0.9,
  camo: 0.85,
}

export function FilmPattern({ id, film, tint, scale: scaleOverride }: FilmPatternProps) {
  const scale = scaleOverride ?? filmScale[film]
  switch (film) {
    case "carbon":
      return (
        <pattern id={id} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform={`rotate(45) scale(${scale})`}>
          <rect width={10} height={10} fill="#121413" />
          <rect width={5} height={5} fill={tint} opacity={0.5} />
          <rect x={5} y={5} width={5} height={5} fill={tint} opacity={0.5} />
          <rect width={5} height={2} fill="#fff" opacity={0.12} />
          <rect x={5} y={5} width={5} height={2} fill="#fff" opacity={0.12} />
        </pattern>
      )
    case "forged":
      return (
        <pattern id={id} width={44} height={44} patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <rect width={44} height={44} fill="#141615" />
          <path d="M0 4 L14 0 L18 10 L6 16 Z" fill={tint} opacity={0.55} />
          <path d="M22 2 L38 6 L30 18 L20 12 Z" fill="#fff" opacity={0.14} />
          <path d="M4 22 L18 18 L22 32 L8 34 Z" fill="#fff" opacity={0.1} />
          <path d="M26 22 L42 20 L44 36 L30 38 Z" fill={tint} opacity={0.4} />
          <path d="M12 36 L26 40 L20 44 L8 44 Z" fill={tint} opacity={0.3} />
          <path d="M34 8 L44 12 L40 18 Z" fill={tint} opacity={0.6} />
        </pattern>
      )
    case "hex":
      return (
        <pattern id={id} width={18} height={31.2} patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <rect width={18} height={31.2} fill="#121413" />
          <path
            d="M9 0 L18 5.2 L18 15.6 L9 20.8 L0 15.6 L0 5.2 Z M9 20.8 L9 31.2 M0 15.6 L0 26 M18 15.6 L18 26"
            fill="none"
            stroke={tint}
            strokeWidth={1.6}
            opacity={0.9}
          />
        </pattern>
      )
    case "camo":
      return (
        <pattern id={id} width={64} height={64} patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <rect width={64} height={64} fill={tint} />
          <path d="M2 10 C12 2, 24 6, 22 16 C20 26, 6 24, 2 10 Z" fill="#1d211c" opacity={0.85} />
          <path d="M34 4 C48 0, 60 10, 54 20 C46 28, 32 18, 34 4 Z" fill="#4b5240" opacity={0.8} />
          <path d="M10 36 C22 30, 34 40, 28 50 C20 60, 4 52, 10 36 Z" fill="#4b5240" opacity={0.8} />
          <path d="M40 34 C52 30, 64 42, 58 54 C50 62, 36 50, 40 34 Z" fill="#1d211c" opacity={0.85} />
          <path d="M26 24 C32 22, 36 28, 32 32 C26 34, 22 28, 26 24 Z" fill="#fff" opacity={0.18} />
        </pattern>
      )
  }
}
