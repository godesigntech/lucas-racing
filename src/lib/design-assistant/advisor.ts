import "server-only"

import type { DesignAnalysis, DesignBrief } from "@/types/design-assistant"
import type { CatalogProduct } from "@/types/product"

import { matchDesign } from "./match"

/**
 * Turns a customer's brief into a concept and matching designs.
 *
 * Only the built-in colour matcher exists today. When the client confirms an AI
 * provider, add an advisor here that sends the photo and catalogue to it (with
 * its key read from the server environment) and select it with AI_PROVIDER.
 * Keep `colourMatchAdvisor` as the fallback if the provider fails.
 */
export interface DesignAdvisor {
  analyse(brief: DesignBrief, catalog: CatalogProduct[]): Promise<DesignAnalysis | null>
}

const colourMatchAdvisor: DesignAdvisor = {
  async analyse(brief, catalog) {
    return matchDesign(brief, catalog)
  },
}

export function getDesignAdvisor(): DesignAdvisor {
  return colourMatchAdvisor
}
