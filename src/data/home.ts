export type BenefitIcon = "layers" | "droplets" | "sparkles" | "flag"

export interface Benefit {
  icon: BenefitIcon
  title: string
  body: string
}

export const benefits: Benefit[] = [
  {
    icon: "layers",
    title: "Templates you can make your own",
    body: "Start from a racing-line layout and change every section: colours, films, name, number and logos.",
  },
  {
    icon: "droplets",
    title: "A real hydro-dip library",
    body: "Carbon, forged, hex, camo and more. Most films take a tint, so carbon plus blue becomes blue carbon.",
  },
  {
    icon: "sparkles",
    title: "Chrome done in-house",
    body: "A mirror chrome base under your graphics. It's done in our own workshop, so it isn't outsourced.",
  },
  {
    icon: "flag",
    title: "Handed over at the track",
    body: "Collect from the workshop, have it couriered, or pick it up at selected tracks in the North East and Yorkshire.",
  },
]

export interface ProcessStep {
  title: string
  body: string
}

export const processSteps: ProcessStep[] = [
  {
    title: "Pick your shell",
    body: "Arai SK-6 or Bell KC7. Buy it through us in your size, or send in your own.",
  },
  {
    title: "Design it",
    body: "Choose a template, then set colours, films, trims, spoiler, name and number.",
  },
  {
    title: "Approve the proof",
    body: "You sign off the exact design. Nothing is masked or dipped until you do.",
  },
  {
    title: "Dip, lacquer, race",
    body: "Hydro Karts dips, details and lacquers it, then it's back on the grid.",
  },
]

export interface Testimonial {
  quote: string
  name: string
  detail: string
}

// Sample testimonials for layout only. Replace with real customer reviews before launch.
export const sampleTestimonials: Testimonial[] = [
  {
    quote: "Sent my old SK-6 in looking tired and got it back looking better than new. The carbon stripes are spot on.",
    name: "Sample customer",
    detail: "Junior X30 driver",
  },
  {
    quote: "Being able to see the proof and change the trim colour before they started made it easy to say yes.",
    name: "Sample customer",
    detail: "Parent of a Cadet racer",
  },
  {
    quote: "Picked it up at the track on a Thursday night. The chrome under the black sweep is unreal in the sun.",
    name: "Sample customer",
    detail: "Club Rotax Senior",
  },
]
