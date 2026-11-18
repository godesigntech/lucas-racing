// Photos supplied by Lucas Racing. Only client-supplied or client-approved photos go on the site:
// never stock or unrelated racing images. Originals are in assets/client-originals;
// web copies are made by scripts/prepare-brand-assets.mjs.

export interface SiteImage {
  src: string
  alt: string
}

export const images = {
  teamPhoto: {
    src: "/images/team/team-photo.webp",
    alt: "The Lucas Racing team and drivers together in the paddock in black team shirts",
  },
  teamAwning: {
    src: "/images/team/team-awning.webp",
    alt: "The Lucas Racing and MS Kart team awning lit up at a race meeting",
  },
  howard: {
    src: "/images/team/howard.webp",
    alt: "Howard Lucas shaking hands with a driver in the paddock",
  },
  connor: {
    src: "/images/team/connor.webp",
    alt: "Connor Lucas checking tyre pressures on an MS Kart",
  },
  connorCoaching: {
    src: "/images/team/connor-coaching.webp",
    alt: "Connor Lucas coaching a young driver sitting in his kart",
  },
  wendy: {
    src: "/images/team/wendy.webp",
    alt: "Wendy Lucas at the team hospitality table at a race meeting",
  },
  fatherAndSon: {
    src: "/images/team/father-and-son.webp",
    alt: "A Lucas Racing driver and Howard Lucas sharing a laugh in the paddock",
  },
  fatherAndSonPaddock: {
    src: "/images/team/father-and-son-paddock.webp",
    alt: "A driver in an MS Kart and Lucas Racing race suit talking with Howard Lucas",
  },
} satisfies Record<string, SiteImage>

/**
 * Cut-out helmet photos on transparent backgrounds, used in the Customisation section:
 * helmets HydroKarts painted (scripts/prepare-helmet-photo.mjs cuts them out).
 */
export const helmetPhotos = {
  paisley: {
    src: "/images/helmets/arai-paisley.webp",
    alt: "Arai kart helmet painted by HydroKarts in a gold and blue paisley film with black stripes and a gold mirrored visor",
    width: 900,
    height: 854,
  },
  tealGold: {
    src: "/images/helmets/arai-teal-gold.webp",
    alt: "Arai kart helmet painted by HydroKarts in teal and white with gold pinstripes and a green mirrored visor",
    width: 900,
    height: 751,
  },
} satisfies Record<string, SiteImage & { width: number; height: number }>
