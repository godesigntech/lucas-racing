/**
 * Exterior parts the customer can colour on their own, per helmet. Mesh names are as
 * three.js loads them (it drops dots and swaps spaces for underscores), verified against
 * Bell_KC7_customizable.glb and arai-sk6.glb.
 */
export const helmetParts = [
  { key: "eyeportTrim", label: "Eyeport trim", hint: "The trim around the visor opening.", defaultColour: null, meshes: { "bell-kc7": ["RubberEyeport"], "arai-sk6": ["RubberEyeport"] } },
  { key: "baseTrim", label: "Base trim", hint: "The trim around the helmet’s lower edge.", defaultColour: null, meshes: { "bell-kc7": ["RubberBase"], "arai-sk6": ["RubberBase"] } },
  { key: "grille1", label: "GrillZ · left", hint: "Chin grille insert on the left, as worn.", defaultColour: "#ffffff", meshes: { "bell-kc7": ["GrillZ_01"] } },
  { key: "grille2", label: "GrillZ · right", hint: "Chin grille insert on the right, as worn.", defaultColour: "#ffffff", meshes: { "bell-kc7": ["GrillZ_02"] } },
  { key: "visorScrewLeft", label: "Visor screw · left", hint: "Left side when wearing the helmet.", defaultColour: "#ffffff", meshes: { "bell-kc7": ["VisorScrew_Left"] } },
  { key: "visorScrewRight", label: "Visor screw · right", hint: "Right side when wearing the helmet.", defaultColour: "#ffffff", meshes: { "bell-kc7": ["VisorScrew_Right"] } },
  { key: "chinVent", label: "Chin vent", hint: "The vent slot on the chin.", defaultColour: "#3a3d40", meshes: { "arai-sk6": ["ChinVent"] } },
  { key: "visorPivot", label: "Visor pivot", hint: "The visor pivot plate and lever on the side.", defaultColour: "#3a3d40", meshes: { "arai-sk6": ["VisorPivot"] } },
  { key: "sideVents", label: "Side vents", hint: "The side pods and their round vents, both sides.", defaultColour: "#3a3d40", meshes: { "arai-sk6": ["visor_opener_part_2004", "visor_opener_part_2005"] } },
  { key: "screws", label: "Screws & bolts", hint: "The visor pivot bolt and the screws on the sides.", defaultColour: "#3a3d40", meshes: { "arai-sk6": ["VisorPivotBolt", "bolt001", "visor_opener_part_2", "visor_opener_part_2003", "visor_opener_part_2006", "visor_opener_part_2007"] } },
] as const

export type HelmetPart = (typeof helmetParts)[number]
export type HelmetPartKey = HelmetPart["key"]
export type HelmetPartColours = Partial<Record<HelmetPartKey, string>>

/** The parts this helmet has, in display order. */
export function partsFor(model: string): HelmetPart[] {
  return helmetParts.filter((part) => model in part.meshes)
}

/** The part a mesh belongs to, if any (mesh names don't clash between helmets). */
export function partForMesh(mesh: string): HelmetPart | undefined {
  return helmetParts.find((part) => Object.values(part.meshes).some((names: readonly string[]) => names.includes(mesh)))
}

/** True when the customer coloured an accessory. Included in the price; the illustrated image can't show them. */
export function hasCustomParts(config: HelmetPartColours & { model: string }) {
  return partsFor(config.model).some(({ key }) => Boolean(config[key]))
}
