import type { ConfigKey } from "@/types/configurator"

export type StudioStepId = "helmet" | "design" | "materials" | "details" | "review"

export interface StudioStep {
  id: StudioStepId
  label: string
  title: string
  description: string
  /** Option groups edited on this step. */
  groups: ConfigKey[]
}

export const studioSteps: StudioStep[] = [
  {
    id: "helmet",
    label: "Helmet",
    title: "Choose your starting point.",
    description: "Pick the shell and whether we supply a new helmet or customise yours.",
    groups: ["route", "model", "size"],
  },
  {
    id: "design",
    label: "Design",
    title: "Set the base.",
    description: "Choose the finish and the main shell colour behind the graphic.",
    groups: ["finish", "base"],
  },
  {
    id: "materials",
    label: "Materials",
    title: "Pick your film and trims.",
    description: "Dip the graphic in a hydro-dip film and choose your rubber colours.",
    groups: ["film", "trim"],
  },
  {
    id: "details",
    label: "Details",
    title: "Finishing touches.",
    description: "Add a rear spoiler. Your name and number go on at the proof stage.",
    groups: ["spoiler"],
  },
  {
    id: "review",
    label: "Review",
    title: "Review your build.",
    description: "Check everything before it goes in your basket. You approve a proof before we start.",
    groups: [],
  },
]
