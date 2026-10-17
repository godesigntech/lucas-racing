import "server-only"

import type { DesignAnalysis, DesignBrief } from "@/types/design-assistant"
import type { CatalogProduct } from "@/types/product"

import { matchDesign } from "./match"
import { analyseWithOpenAi, openAiConfigured } from "./openai"

/**
 * Turns a customer's brief into a concept and matching designs: with OpenAI when
 * OPENAI_API_KEY is set, otherwise (or if OpenAI fails or is slow) with the
 * built-in colour matcher, so the assistant always answers.
 */
export interface DesignAdvisor {
  analyse(brief: DesignBrief, catalog: CatalogProduct[]): Promise<DesignAnalysis | null>
}

const colourMatchAdvisor: DesignAdvisor = {
  async analyse(brief, catalog) {
    const analysis = matchDesign(brief, catalog)
    return analysis && { ...analysis, aiPowered: false }
  },
}

const openAiAdvisor: DesignAdvisor = {
  async analyse(brief, catalog) {
    try {
      return { ...(await analyseWithOpenAi(brief, catalog)), aiPowered: true }
    } catch (error) {
      console.error("OpenAI design analysis failed, using the colour matcher:", error instanceof Error ? error.message : error)
      return colourMatchAdvisor.analyse(brief, catalog)
    }
  },
}

export function getDesignAdvisor(): DesignAdvisor {
  return openAiConfigured() ? openAiAdvisor : colourMatchAdvisor
}
