/** Names verified against Bell_KC7_customizable.glb. BulletZ is not supplied yet. */
export const bellParts = [
  { key: "eyeportTrim", mesh: "RubberEyeport", label: "Eyeport TrimZ", hint: "The trim around the visor opening.", defaultColour: null },
  { key: "baseTrim", mesh: "RubberBase", label: "Base TrimZ", hint: "The trim around the helmet’s lower edge.", defaultColour: null },
  { key: "grille1", mesh: "GrillZ_01", label: "GrillZ · insert 1", hint: "First chin grille insert.", defaultColour: "#ffffff" },
  { key: "grille2", mesh: "GrillZ_02", label: "GrillZ · insert 2", hint: "Second chin grille insert.", defaultColour: "#ffffff" },
  { key: "visorScrewLeft", mesh: "VisorScrew_Left", label: "Visor screw · left", hint: "Left side when wearing the helmet.", defaultColour: "#ffffff" },
  { key: "visorScrewRight", mesh: "VisorScrew_Right", label: "Visor screw · right", hint: "Right side when wearing the helmet.", defaultColour: "#ffffff" },
] as const

export type BellPartKey = (typeof bellParts)[number]["key"]
export type BellPartColours = Partial<Record<BellPartKey, string>>

/** These custom accessory colours have no configured workshop prices yet. */
export function hasCustomBellParts(config: BellPartColours & { model: string }) {
  return config.model === "bell-kc7" && bellParts.some(({ key }) => Boolean(config[key]))
}
