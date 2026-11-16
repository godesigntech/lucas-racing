// Logos supplied by the client, used as supplied (background made transparent, never redrawn).
// Originals live in assets/client-originals; regenerate with scripts/prepare-brand-assets.mjs.

export interface BrandLogo {
  src: string
  alt: string
  width: number
  height: number
}

export const brandLogos = {
  lucasRacing: { src: "/images/brand/lucas-racing-logo.png", alt: "Lucas Racing", width: 402, height: 163 },
  /** "Lucas Racing by HydroKarts.co.uk", in the header on the customisation pages. */
  lucasRacingHydroKarts: { src: "/images/brand/lucas-racing-hydrokarts-logo.png", alt: "Lucas Racing by HydroKarts", width: 1527, height: 311 },
  /** Customisation section only. */
  lucasRacingByHydroKarts: {
    src: "/images/brand/lucas-racing-by-hydrokarts.png",
    alt: "Lucas Racing by HydroKarts.co.uk",
    width: 2057,
    height: 437,
  },
  /**
   * The HydroKarts.co.uk wordmark, cut from the supplied Lucas Racing by HydroKarts logo.
   * Shown beside the MS Kart logo with a plain "by" until a combined logo is approved.
   */
  hydroKarts: { src: "/images/brand/hydrokarts-logo.png", alt: "HydroKarts.co.uk", width: 599, height: 207 },
  /** MS Kart shop and distributor sections only. */
  msKart: { src: "/images/brand/ms-kart-logo.png", alt: "MS Kart Racing Technology", width: 734, height: 216 },
} satisfies Record<string, BrandLogo>

/** The Instagram accounts people tag when they share their helmet design (competition, builder). */
export const shareTags = "@hydro.karts and @ms.lucasracing"
