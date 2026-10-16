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

/** Cut-out helmet photos on transparent backgrounds, used in the Customisation section. */
export const helmetPhotos = {
  araiSk6: {
    src: "/images/helmets/arai-sk6-custom.webp",
    alt: "Custom-painted Arai SK-6 kart helmet in orange, blue and lime with a mirrored visor",
    width: 647,
    height: 550,
  },
  bellKc7: {
    src: "/images/helmets/bell-kc7-championship.webp",
    alt: "Bell KC7 kart helmet in fluorescent yellow with green and grey racing lines",
    width: 685,
    height: 693,
  },
} satisfies Record<string, SiteImage & { width: number; height: number }>
