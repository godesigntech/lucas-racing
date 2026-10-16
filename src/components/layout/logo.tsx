import Image from "next/image"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { brandLogos } from "@/constants/brand"
import { cn } from "@/lib/utils"

interface LogoProps {
  /** "light" for dark backgrounds: the black logo then sits on a light panel, since the artwork isn't recoloured. */
  tone?: "dark" | "light"
  /** Rendered height in pixels; the width follows the artwork. */
  height?: number
  /** Load straight away (above the fold). */
  preload?: boolean
  className?: string
  /** Responsive sizing for the image, e.g. a larger logo on desktop. */
  imageClassName?: string
}

/** The Lucas Racing logo, linking home. Uses the client's artwork as supplied. */
export function Logo({ tone = "dark", height = 40, preload, className, imageClassName }: LogoProps) {
  const { src, width: naturalWidth, height: naturalHeight } = brandLogos.lucasRacing
  const width = Math.round((naturalWidth / naturalHeight) * height)

  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-85",
        tone === "light" && "bg-paper px-3 py-2",
        className,
      )}
    >
      <Image src={src} alt="" width={width} height={height} preload={preload} sizes={`${width}px`} className={imageClassName} />
    </Link>
  )
}
