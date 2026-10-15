export type BuilderStepId = "helmet" | "size" | "template" | "parts" | "finish" | "details" | "trims" | "review"

export interface BuilderStep {
  id: BuilderStepId
  label: string
  title: string
  description: string
}

export const builderSteps: BuilderStep[] = [
  { id: "helmet", label: "Helmet", title: "Choose your helmet", description: "We supply a brand-new helmet, customised in our UK workshop." },
  { id: "size", label: "Size", title: "Pick your size", description: "Measure around your head just above the eyebrows." },
  { id: "template", label: "Template", title: "Choose a template", description: "The layout of stripes and shapes you'll colour in next." },
  { id: "parts", label: "Parts", title: "Colour each part", description: "Paint every part with a colour, a hydro-dip film or chrome." },
  { id: "finish", label: "Finish", title: "Choose the finish", description: "The lacquer over your design." },
  { id: "details", label: "Name & logo", title: "Name, number and logo", description: "Optional. Free, and placed on your proof for you to approve." },
  { id: "trims", label: "Trims", title: "Trims and spoiler", description: "Rubber colours and an optional rear spoiler." },
  { id: "review", label: "Review", title: "Review your helmet", description: "Check everything, then add it to your basket." },
]
