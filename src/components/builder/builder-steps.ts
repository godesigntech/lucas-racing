export type BuilderStepId =
  | "helmet"
  | "aero"
  | "template"
  | "colours"
  | "materials"
  | "films"
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
  { id: "aero", group: "Helmet", stage: "build", label: "Aero", title: "Choose your aero kit", description: "The standard shell, or a spoiler that fits your helmet." },
  { id: "template", group: "Design", stage: "build", label: "Template", title: "Choose a template", description: "The layout of stripes and shapes you'll colour in next." },
  { id: "colours", group: "Design", stage: "build", label: "Colours", title: "Customise your colours", description: "Pick a colour for each part of the design." },
  { id: "materials", group: "Design", stage: "build", label: "Paint", title: "Choose paint finishes", description: "Solid, metallic or chrome — set separately for each part." },
  { id: "films", group: "Design", stage: "build", label: "Films", title: "Apply hydrographic films", description: "Wrap any part in a hydro-dip film instead of paint." },
  { id: "pinstripes", group: "Design", stage: "build", label: "Pinstripes", title: "Customise your pinstripes", description: "The fine racing lines that outline your design." },
  { id: "finish", group: "Design", stage: "build", label: "Finish", title: "Choose the overall finish", description: "The lacquer over the whole helmet." },
  { id: "details", group: "Personal", stage: "build", label: "Personal", title: "Add your personal details", description: "Your name, racing number, initials, flag or your own words." },
  { id: "logos", group: "Personal", stage: "build", label: "Logos", title: "Add sponsor and team logos", description: "Upload artwork and place it on the helmet. We check every file before production." },
  { id: "exterior", group: "Fittings", stage: "build", label: "Exterior", title: "Customise exterior components", description: "Rubber trims, GrillZ and visor fittings." },
  { id: "visor", group: "Fittings", stage: "build", label: "Visor", title: "Choose your visor", description: "Clear, smoked, coloured or iridium." },
  { id: "visorStrip", group: "Fittings", stage: "build", label: "Visor strip", title: "Design your visor strip", description: "The printed band across the top of the visor." },
  { id: "review", group: "Order", stage: "build", label: "Review", title: "Review your design", description: "Check everything, then add it to your basket." },
  { id: "confirm", group: "Order", stage: "checkout", label: "Confirm", title: "Confirm your order", description: "Your details, a production start date and your estimated completion." },
  { id: "production", group: "Order", stage: "after", label: "Production", title: "Production and delivery", description: "We send a proof to approve, then build and deliver your helmet." },
]

/** The steps the builder itself shows. */
export const buildSteps = builderSteps.filter((step) => step.stage === "build")

export function stepIndex(id: BuilderStepId): number {
  return builderSteps.findIndex((step) => step.id === id)
}
