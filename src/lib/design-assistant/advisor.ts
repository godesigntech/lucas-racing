import "server-only"

import type { DesignAnalysis, DesignBrief } from "@/types/design-assistant"
import type { CatalogProduct } from "@/types/product"

import { matchDesign } from "./match"
import { analyseWithGemini, geminiConfigured } from "./gemini"

/**
 * Turns a customer's brief into a concept and matching designs: with Gemini when
 * GEMINI_API_KEY is set, otherwise (or if Gemini fails or is slow) with the
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

const geminiAdvisor: DesignAdvisor = {
  async analyse(brief, catalog) {
    try {
      return { ...(await analyseWithGemini(brief, catalog)), aiPowered: true }
    } catch (error) {
      console.error("Gemini design analysis failed, using the colour matcher:", error instanceof Error ? error.message : error)
      return colourMatchAdvisor.analyse(brief, catalog)
    }
  },
}

export function getDesignAdvisor(): DesignAdvisor {
  return geminiConfigured() ? geminiAdvisor : colourMatchAdvisor
}
