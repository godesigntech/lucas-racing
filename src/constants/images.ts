// Unsplash photos (free to use under the Unsplash License). Swap for the team's
// own photography once it's supplied.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`

export const images = {
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
} as const
