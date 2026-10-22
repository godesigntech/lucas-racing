import type { HelmetLook } from "@/types/helmet"

import { nameColour } from "./colour"

// The designer's brief for the image model that paints the AI concept, and what
// the image services (./openai, ./cloudflare) share.

export class ConceptImageError extends Error {
  constructor(
    message: string,
    /** Why it failed: flagged (content filter), quota (allowance or credit used up) or failed. */
    readonly reason: "flagged" | "quota" | "failed",
  ) {
    super(message)
  }
}

/** The JPEG bytes of a data URL photo (the browser always sends a JPEG). */
export function photoBytes(dataUrl: string | undefined): Buffer | undefined {
  const data = dataUrl && /^data:image\/jpeg;base64,(.*)$/.exec(dataUrl)?.[1]
  return data ? Buffer.from(data, "base64") : undefined
}

export interface ImageRequest {
  /** Resized photo of the customer's helmet or inspiration, as a data URL. */
  photo?: string
  note: string
  /** The concept summary from the analysis, to keep the image and the suggestion in step. */
  summary: string
  number?: string
  /** The concept's colours, layout, finish and film. */
  concept?: Pick<HelmetLook, "layout" | "finish" | "base" | "graphic" | "accent" | "film" | "trim">
}

// How each template layout should read as a professional livery.
const layoutBriefs: Record<HelmetLook["layout"], string> = {
  apex: "a bold apex sweep: a sharp chevron that starts at the chin bar and sweeps up and back over the crown",
  twin: "twin racing stripes running from the front of the crown over the top to the back, with fine outlines",
  split: "a split two-tone design with a dramatic angled division between two colour panels",
  shard: "angular shards and broken geometric shapes that fragment across the sides, like shattered glass",
  halo: "a halo band circling the helmet above the visor, with graphics radiating from it",
  flow: "flowing, fluid racing lines and waves that wrap around the shell from front to back",
  blank: "a clean, minimal design: a solid shell with subtle accent lines and premium detailing",
}

const filmBriefs: Record<HelmetLook["film"], string> = {
  none: "",
  carbon: "carbon-fibre weave hydro-dip film",
  forged: "forged-carbon hydro-dip film",
  hex: "hexagonal honeycomb hydro-dip film",
  camo: "camouflage hydro-dip film",
}

const finishBriefs: Record<HelmetLook["finish"], string> = {
  gloss: "deep high-gloss clear coat with crisp reflections",
  satin: "smooth satin clear coat with soft sheen",
  matte: "flat matte clear coat with a soft, non-reflective surface",
  chrome: "polished mirror chrome base with paint over it",
}

/**
 * A designer's brief for the image model: a real custom livery, not a recolour.
 * With a photo it's an edit: the customer's own helmet, repainted, in the same shot.
 */
export function imagePrompt({ photo, note, summary, number, concept }: ImageRequest): string {
  const colour = (value: string) => `${nameColour(value)} (${value})`
  const subject = photo
    ? "Edit the helmet in the reference image. Repaint only its painted shell with a new custom design. Keep everything else exactly as in the photo: the same helmet model and shape, the same visor, vents, spoiler and hardware, the same camera angle, framing, lighting and background."
    : "Create a professional custom paint design for a modern full-face kart racing helmet with a dark tinted visor."
  const design = concept
    ? [
        `Design layout: ${layoutBriefs[concept.layout]}.`,
        `Colours: ${colour(concept.base)} as the main shell colour, ${colour(concept.graphic)} for the main graphics, ${colour(concept.accent)} for pinstripes and outlines, rubber trim in ${colour(concept.trim)}.`,
        filmBriefs[concept.film] ? `Use ${filmBriefs[concept.film]} inside the main graphic shapes.` : "",
        `Finish: ${finishBriefs[concept.finish]}.`,
      ]
    : []
  // Written for FLUX: short, and only says what should be in the picture. It
  // doesn't understand "no X" (naming logos or hands tends to add them), so the
  // paint is described as clean instead. Logos and names copied from a reference
  // photo also trip Cloudflare's content filter.
  return [
    subject,
    note ? `The customer's request: "${note}"` : "",
    !concept && summary ? `Design concept: ${summary}` : "",
    ...design,
    "Top motorsport helmet paintwork: layered graphic shapes with sharp edges, colour fades and thin contrasting pinstripes, symmetrical on both sides, premium and race-ready.",
    number ? `The race number ${number} on the side in a bold racing font.` : "",
    "Any name or word the customer asked for is painted exactly as written, in bold motorsport lettering along the side or the back. All other paint is clean, with plain unbranded surfaces.",
    photo
      ? "Photorealistic, matching the original photo."
      : "Photorealistic studio product shot: one helmet, three-quarter front view, centred on a seamless dark charcoal background, soft key light and rim light, sharp detail.",
  ]
    .filter(Boolean)
    .join("\n")
}

