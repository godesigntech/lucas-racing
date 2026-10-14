// Photos from Unsplash (free for commercial use under the Unsplash License, no attribution required).
// Swap for the team's own photography once it's supplied.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2000&q=80`

export interface SiteImage {
  src: string
  alt: string
}

export const images = {
  heroKarts: {
    src: unsplash("photo-1505570554449-69ce7d4fa36b"),
    alt: "Two karts racing side by side on a club circuit",
  },
  cornerKart: {
    src: unsplash("photo-1503323553823-197edadf86b2"),
    alt: "Kart number 18 turning into a corner",
  },
  pack: {
    src: unsplash("photo-1522211041032-a7eb9a3f8c0f"),
    alt: "Three karts racing through a bend",
  },
  orangeKart: {
    src: unsplash("photo-1640084347692-e8f6b84caa7c"),
    alt: "Kart driver in an orange helmet at speed",
  },
  helmetCloseUp: {
    src: unsplash("photo-1761044291310-5be15d1cb992"),
    alt: "Close-up of a custom-painted racing helmet",
  },
  workshop: {
    src: unsplash("photo-1546313884-b5faaf7ef9fa"),
    alt: "Rows of paint cans on a workshop bench",
  },
  raceCorner: {
    src: unsplash("photo-1774071900037-0c389715fbed"),
    alt: "Three karts racing through a corner on a club circuit",
  },
  driverHelmet: {
    src: unsplash("photo-1555349108-37708aaf1d22"),
    alt: "Kart driver in a green custom helmet at speed",
  },
  kartSide: {
    src: unsplash("photo-1630160869357-c57ba6628584"),
    alt: "Blue kart at full speed on a sunny track",
  },
  kartGrid: {
    src: unsplash("photo-1779128773315-1f23065eba90"),
    alt: "Rows of numbered karts lined up in the pit lane",
  },
} satisfies Record<string, SiteImage>
