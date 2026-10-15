import { cn } from "@/lib/utils"
import type { HelmetLook } from "@/types/helmet"

import { FilmPattern } from "./film-pattern"
import {
  BASE_EDGE_PATH,
  LAYOUTS,
  SHELL_PATH,
  SPOILER_PATH,
  TOP_VENT_PATH,
  VIEW_BOXES,
  VISOR_PATH,
  type HelmetView,
} from "./helmet-geometry"

interface HelmetArtProps {
  look: HelmetLook
  view?: HelmetView
  /** Accessible description. Omit for decorative use. */
  title?: string
  className?: string
  /** Outlines one part, e.g. while the customer is painting it in the builder. */
  highlight?: "base" | "graphic" | "accent"
}

const PLASTIC = "#1b1e1c"
/** Size (in viewBox units) one film photo covers on the illustration. */
const FILM_TILE = 150

/** Stable short hash so each distinct look gets its own SVG ids. */
function hashLook(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

/** Illustrated side profile of a custom helmet, driven entirely by `look`. */
export function HelmetArt({ look, view = "full", title, className, highlight }: HelmetArtProps) {
  const uid = `h${hashLook(JSON.stringify(look))}-${view}`
  const ids = {
    clip: `${uid}-clip`,
    film: `${uid}-film`,
    chrome: `${uid}-chrome`,
    gloss: `${uid}-gloss`,
    shade: `${uid}-shade`,
    visor: `${uid}-visor`,
    shadow: `${uid}-shadow`,
    baseFilm: `${uid}-base-film`,
    accentFilm: `${uid}-accent-film`,
  }
  const layout = LAYOUTS[look.layout]
  const hasFilm = Boolean(look.filmTexture) || look.film !== "none"
  const graphicFill = hasFilm ? `url(#${ids.film})` : look.graphic
  const baseFill = look.finish === "chrome" ? `url(#${ids.chrome})` : look.baseTexture ? `url(#${ids.baseFilm})` : look.base
  const accentStroke = look.accentTexture ? `url(#${ids.accentFilm})` : look.accent
  const glossOpacity = { matte: 0.12, satin: 0.28, gloss: 0.5, chrome: 0.7 }[look.finish]
  const outline = { stroke: "#c6f432", strokeWidth: 4, strokeDasharray: "10 7", fill: "none" } as const

  return (
    <svg
      viewBox={VIEW_BOXES[view]}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-auto w-full", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <clipPath id={ids.clip}>
          <path d={SHELL_PATH} />
        </clipPath>
        {look.filmTexture ? (
          <pattern id={ids.film} width={FILM_TILE} height={FILM_TILE} patternUnits="userSpaceOnUse">
            <image href={look.filmTexture} width={FILM_TILE} height={FILM_TILE} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        ) : (
          look.film !== "none" && <FilmPattern id={ids.film} film={look.film} tint={look.graphic} />
        )}
        {look.baseTexture && (
          <pattern id={ids.baseFilm} width={FILM_TILE} height={FILM_TILE} patternUnits="userSpaceOnUse">
            <image href={look.baseTexture} width={FILM_TILE} height={FILM_TILE} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        )}
        {look.accentTexture && (
          <pattern id={ids.accentFilm} width={FILM_TILE / 2} height={FILM_TILE / 2} patternUnits="userSpaceOnUse">
            <image href={look.accentTexture} width={FILM_TILE / 2} height={FILM_TILE / 2} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        )}
        <linearGradient id={ids.chrome} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#fbfcfd" />
          <stop offset="0.28" stopColor="#a7adb5" />
          <stop offset="0.46" stopColor="#eef0f2" />
          <stop offset="0.7" stopColor="#5f656d" />
          <stop offset="1" stopColor="#c9cdd2" />
        </linearGradient>
        <radialGradient id={ids.gloss} cx="0.4" cy="0.2" r="0.55">
          <stop offset="0" stopColor="#fff" stopOpacity={glossOpacity} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={ids.visor} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a4250" />
          <stop offset="0.55" stopColor="#0d1117" />
          <stop offset="1" stopColor="#252c36" />
        </linearGradient>
        <filter id={ids.shadow} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <ellipse cx="262" cy="304" rx="178" ry="13" fill="#000" opacity="0.22" filter={`url(#${ids.shadow})`} />

      {look.spoiler && (
        <path d={SPOILER_PATH} fill={look.graphic} stroke="#000" strokeOpacity="0.3" strokeWidth="1.5" />
      )}

      <path d={SHELL_PATH} fill={baseFill} />

      <g clipPath={`url(#${ids.clip})`}>
        {layout.fills.map((d) => (
          <path key={d} d={d} fill={graphicFill} />
        ))}
        {layout.bands?.map((band) => (
          <path key={band.d} d={band.d} fill="none" stroke={graphicFill} strokeWidth={band.width} strokeLinecap="round" />
        ))}
        {layout.strokes.map((stroke) => (
          <path key={stroke.d} d={stroke.d} fill="none" stroke={accentStroke} strokeWidth={stroke.width} strokeLinecap="round" />
        ))}
        {layout.guides?.map((d) => (
          <path key={d} d={d} fill="none" stroke={look.graphic} strokeOpacity="0.35" strokeWidth="2" strokeDasharray="6 7" />
        ))}

        {look.number && (
          <text
            x="214"
            y="222"
            textAnchor="middle"
            fontSize="62"
            fontWeight="800"
            fill={look.accent}
            stroke={look.graphic}
            strokeWidth="3"
            paintOrder="stroke"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {look.number}
          </text>
        )}
        {look.name && (
          <text
            x="214"
            y="252"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            letterSpacing="4"
            fill={look.graphic}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {look.name}
          </text>
        )}

        <path d={BASE_EDGE_PATH} fill="none" stroke={look.trim} strokeWidth="18" />
        <rect x="40" y="30" width="420" height="300" fill={`url(#${ids.shade})`} />
        <ellipse cx="236" cy="104" rx="150" ry="62" transform="rotate(-10 236 104)" fill={`url(#${ids.gloss})`} />
      </g>

      <path d={SHELL_PATH} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d={TOP_VENT_PATH} fill={PLASTIC} />

      <g>
        <rect x="370" y="236" width="34" height="4" rx="2" transform="rotate(-12 387 238)" fill={PLASTIC} />
        <rect x="372" y="246" width="30" height="4" rx="2" transform="rotate(-12 387 248)" fill={PLASTIC} />
        <rect x="376" y="256" width="24" height="4" rx="2" transform="rotate(-12 388 258)" fill={PLASTIC} />
      </g>

      <path d={VISOR_PATH} fill="none" stroke={look.trim} strokeWidth="8" strokeLinejoin="round" />
      <path d={VISOR_PATH} fill={`url(#${ids.visor})`} />
      <path d="M302 150 C338 136 384 134 410 146" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />

      <ellipse cx="296" cy="174" rx="15" ry="17" fill={PLASTIC} />
      <circle cx="296" cy="174" r="4.5" fill="#3a3f3c" />

      {highlight === "base" && <path d={SHELL_PATH} {...outline} />}
      {highlight && highlight !== "base" && (
        <g clipPath={`url(#${ids.clip})`}>
          {highlight === "graphic" &&
            layout.fills.map((d) => <path key={d} d={d} {...outline} />)}
          {highlight === "graphic" &&
            layout.bands?.map((band) => <path key={band.d} d={band.d} {...outline} strokeWidth={band.width + 6} strokeOpacity={0.55} />)}
          {highlight === "accent" &&
            layout.strokes.map((stroke) => <path key={stroke.d} d={stroke.d} {...outline} strokeWidth={stroke.width + 7} strokeDasharray="none" strokeOpacity={0.6} />)}
        </g>
      )}
    </svg>
  )
}
