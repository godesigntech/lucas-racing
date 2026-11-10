export type BuilderStepId =
  | "helmet"
  | "template"
  | "aero"
  | "colours"
  | "pinstripes"
  | "finish"
  | "details"
  | "logos"
  | "exterior"
  | "visor"
  | "visorStrip"
  | "review"
  | "confirm"
  | "production"

/** Which part of the journey a step belongs to, for the progress indicator. */
export type BuilderGroup = "Helmet" | "Design" | "Personal" | "Fittings" | "Order"

/**
 * "build"    — a step the customer works through in the builder.
 * "checkout" — happens on the checkout page, after the basket.
 * "after"    — happens once the order is placed; shown so the whole journey is visible.
 */
export type BuilderStage = "build" | "checkout" | "after"

export interface BuilderStep {
  id: BuilderStepId
  label: string
  title: string
  description: string
  group: BuilderGroup
  stage: BuilderStage
}

export const builderSteps: BuilderStep[] = [
  { id: "helmet", group: "Helmet", stage: "build", label: "Helmet", title: "Choose your helmet", description: "Pick the shell and size, and tell us whether we supply it." },
  { id: "template", group: "Design", stage: "build", label: "Template", title: "Choose a template", description: "The layout of stripes and shapes you'll colour in next." },
  { id: "aero", group: "Design", stage: "build", label: "Spoilers", title: "Choose your spoilers", description: "Add any spoilers that fit your helmet, and choose how they're finished." },
  { id: "colours", group: "Design", stage: "build", label: "Colours & films", title: "Colours and films", description: "Give each part of the design a colour, a metallic colour or a hydro-dip film. Tap a part on the helmet to fill it." },
  { id: "finish", group: "Design", stage: "build", label: "Finish", title: "Finish and base coat", description: "Gloss or matte on top, and a standard or chrome base coat underneath." },
  { id: "pinstripes", group: "Design", stage: "build", label: "Racing lines", title: "Customise your racing lines", description: "The lines between the sections of your design: any colour of tape, or holographic tape." },
  { id: "details", group: "Personal", stage: "build", label: "Personal", title: "Add your personal details", description: "Your name, racing number, initials, flag or your own words." },
  { id: "logos", group: "Personal", stage: "build", label: "Logos", title: "Add sponsor and team logos", description: "Upload artwork and place it on the helmet. We check every file before production." },
  { id: "exterior", group: "Fittings", stage: "build", label: "Exterior", title: "Customise exterior components", description: "Rubber trims, GrillZ and visor fittings." },
  { id: "visor", group: "Fittings", stage: "build", label: "Visor", title: "Choose your visor", description: "Clear, smoked, coloured or iridium." },
  { id: "visorStrip", group: "Fittings", stage: "build", label: "Visor sticker", title: "Your visor sticker", description: "The Lucas Racing sticker comes free on every helmet, or have one designed to match yours." },
  { id: "review", group: "Order", stage: "build", label: "Review", title: "Review your design", description: "Check everything, then add it to your basket." },
  { id: "confirm", group: "Order", stage: "checkout", label: "Confirm", title: "Confirm your order", description: "Your details and an estimated production start date." },
  { id: "production", group: "Order", stage: "after", label: "Production", title: "Production and delivery", description: "We send a proof to approve, then build and deliver your helmet." },
]

/** The steps the builder itself shows. */
export const buildSteps = builderSteps.filter((step) => step.stage === "build")

export function stepIndex(id: BuilderStepId): number {
  return builderSteps.findIndex((step) => step.id === id)
}
