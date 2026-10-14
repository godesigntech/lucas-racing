import type { HelmetLook } from "@/types/helmet"

/** Chrome is shown as polished silver; the colour picker is disabled for it in the builder. */
const CHROME = "#e6e8ea"

/** The colour applied to the 3D shell for a design. */
export function shellTint(look: HelmetLook): string {
  return look.finish === "chrome" ? CHROME : look.base
}
