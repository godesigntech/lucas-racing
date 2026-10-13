import { cn } from "@/lib/utils"
import type { FilmId } from "@/types/helmet"

import { FilmPattern } from "./film-pattern"

interface FilmSwatchProps {
  film: Exclude<FilmId, "none">
  tint: string
  className?: string
}

/** Square tile showing a hydro-dip film with a tint. */
export function FilmSwatch({ film, tint, className }: FilmSwatchProps) {
  const id = `swatch-${film}-${tint.replace("#", "")}`
  return (
    <svg viewBox="0 0 80 80" className={cn("size-full", className)} aria-hidden>
      <defs>
        <FilmPattern id={id} film={film} tint={tint} scale={1.2} />
      </defs>
      <rect width="80" height="80" fill={`url(#${id})`} />
    </svg>
  )
}
