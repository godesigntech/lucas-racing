import type { ConfigOptionGroup } from "@/types/configurator"

// Representative options for the product-page configurator. The full 3D
// helmet builder will replace this with per-template zones and real pricing.

export const routeOptions: ConfigOptionGroup = {
  key: "route",
  label: "How you'd like it",
  kind: "choice",
  choices: [
    { value: "new", label: "Supply a new helmet", hint: "We order it in your size" },
    { value: "own", label: "Send my own helmet", hint: "Post it or drop it off" },
  ],
}

export const sizeOptions: ConfigOptionGroup = {
  key: "size",
  label: "Helmet size",
  kind: "choice",
  choices: ["XS", "S", "M", "L", "XL", "XXL"].map((size) => ({ value: size, label: size })),
}

export const finishOptions: ConfigOptionGroup = {
  key: "finish",
  label: "Base finish",
  kind: "choice",
  choices: [
    { value: "gloss", label: "Gloss" },
    { value: "matte", label: "Matte" },
    { value: "chrome", label: "Chrome", hint: "In-house chrome base" },
  ],
}

export const baseColourOptions: ConfigOptionGroup = {
  key: "base",
  label: "Base colour",
  kind: "swatch",
  choices: [
    { value: "#f4f3ee", label: "Paddock white", swatch: "#f4f3ee" },
    { value: "#111412", label: "Carbon black", swatch: "#111412" },
    { value: "#d7261e", label: "Race red", swatch: "#d7261e" },
    { value: "#1f5bd8", label: "Grid blue", swatch: "#1f5bd8" },
    { value: "#ff6a13", label: "Flag orange", swatch: "#ff6a13" },
    { value: "#c6f432", label: "Lucas lime", swatch: "#c6f432" },
  ],
}

export const filmOptions: ConfigOptionGroup = {
  key: "film",
  label: "Hydro-dip film on the graphic",
  kind: "choice",
  description: "Films sample the Hydro Karts library. The full range arrives with the 3D builder.",
  choices: [
    { value: "none", label: "Solid colour" },
    { value: "carbon", label: "Carbon weave" },
    { value: "forged", label: "Forged carbon" },
    { value: "hex", label: "Hex" },
    { value: "camo", label: "Camo" },
  ],
}

export const trimOptions: ConfigOptionGroup = {
  key: "trim",
  label: "Rubber trim",
  kind: "swatch",
  choices: [
    { value: "#111412", label: "Black", swatch: "#111412" },
    { value: "#f4f3ee", label: "White", swatch: "#f4f3ee" },
    { value: "#d7261e", label: "Red", swatch: "#d7261e" },
    { value: "#1f5bd8", label: "Blue", swatch: "#1f5bd8" },
    { value: "#c6f432", label: "Lime", swatch: "#c6f432" },
  ],
}

export const spoilerOptions: ConfigOptionGroup = {
  key: "spoiler",
  label: "Rear spoiler",
  kind: "choice",
  choices: [
    { value: "yes", label: "Fitted" },
    { value: "no", label: "None" },
  ],
}
