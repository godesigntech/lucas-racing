import Image from "next/image"

import { getTemplateArtwork } from "@/lib/helmet-3d/templates"
import { cn } from "@/lib/utils"
import type { HelmetLook } from "@/types/helmet"

interface TemplatePictureProps {
  slug: string
  name: string
  look: HelmetLook
  /** The helmet it's shown on: real 3D pictures are made per helmet model. */
  modelId?: string
  className?: string
}

/**
 * A template's picture: its real 3D render when the designers' artwork exists, otherwise a
 * clean swatch in its colours (templates added in admin have no artwork until it's made).
 */
export function TemplatePicture({ slug, name, look, modelId = "bell-kc7", className }: TemplatePictureProps) {
  const artwork = getTemplateArtwork(modelId, slug)
  if (artwork) {
    return <Image src={artwork.thumbnail} alt={`${name} on the ${modelId === "arai-sk6" ? "Arai SK-6" : "Bell KC7"}, example colours`} width={900} height={900} className={cn("size-full object-contain", className)} />
  }
  return (
    <span
      role="img"
      aria-label={`${name} colours`}
      className={cn("relative block size-full overflow-hidden rounded-xl shadow-inner ring-1 ring-carbon/10", className)}
      style={{
        background: `linear-gradient(115deg, ${look.base} 0 40%, ${look.accent} 40% 42.5%, ${look.graphic} 42.5% 68%, ${look.accent} 68% 70%, ${look.base} 70%)`,
      }}
    >
      {/* A soft gloss, so it reads as a painted finish rather than a flat block. */}
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(160deg,rgb(255_255_255/0.35),transparent_45%,rgb(0_0_0/0.18))]" />
    </span>
  )
}
