import { kartFinishLabels, type ReadyKartLayout } from "@/lib/kart-stickers/options"
import type { KartDesignValues } from "@/lib/validations/kart-stickers"

/** Text from the customer, as plain words inside the prompt (no quotes to break out of). */
const plain = (value: string) => value.replace(/["“”]/g, "'").replace(/\s+/g, " ").trim()

const finishLook: Record<KartDesignValues["finish"], string> = {
  gloss: "a printed gloss vinyl finish with bright, clean colours",
  matt: "a printed matt vinyl finish with flat, even colours",
  holographic: "holographic vinyl: a rainbow foil shimmer showing through the design",
  chrome: "chrome vinyl: mirror-like metallic areas within the design",
}

/**
 * What the AI is asked to do: paint the customer's design into the blank layout's panels,
 * leaving the layout itself (shapes, outlines, background) exactly as it is.
 */
export function kartDesignPrompt(layout: ReadyKartLayout, values: KartDesignValues): string {
  const lines = [
    `Design a printed vinyl sticker kit for a go-kart with ${layout.name} bodywork (the customer's kart: ${plain(values.kartModel)}).`,
    `The first image is the blank kit layout: ${layout.parts}, drawn as plain, undecorated panels on a plain background.`,
    "Paint one complete racing livery inside every panel, filling each panel edge to edge.",
    "Keep everything else exactly as it is: the background and every panel's outline, shape, size and position. Don't add, remove, move or reshape panels, and don't draw outside them.",
    "It's a flat print layout seen straight on: no kart, no mock-up, no perspective, no shadows on the sheet.",
    `The customer's design brief: ${plain(values.prompt)}.`,
    `Style it as ${finishLook[values.finish]} (${kartFinishLabels[values.finish].label}).`,
    values.raceNumber
      ? `Put the race number ${plain(values.raceNumber)} in a clear, bold number panel on the main front panel and on the panels for each side of the kart, in a racing font that's easy to read.`
      : "Don't add any race numbers.",
    values.driverName ? `Write the driver's name, ${plain(values.driverName)}, small and neat on the panels for each side of the kart.` : "Don't add a driver's name.",
    values.logos.length
      ? "The other images are the customer's sponsor logos: place each one, unchanged and in its own colours, on the side panels and the lower front panels."
      : "Don't add any logos.",
    "Use the same colours and motifs on every panel so the kit looks like one matching set. No other text, words or brand names.",
  ]
  return lines.join("\n")
}
