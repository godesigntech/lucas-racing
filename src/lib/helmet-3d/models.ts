import type { HelmetModelId } from "@/types/helmet"

export interface Helmet3dModel {
  /** Optimised .glb served from /public. */
  url: string
  /** True while using a stand-in scan rather than a model with separate parts. */
  placeholder: boolean
}

/** Helmets we can show in 3D. Add the Arai SK-6 here when its model arrives. */
export const helmet3dModels: Partial<Record<HelmetModelId, Helmet3dModel>> = {
  "bell-kc7": { url: "/models/bell-kc7.glb?v=kc7-customizable-2", placeholder: false },
}

export function get3dModel(modelId: HelmetModelId | undefined): Helmet3dModel | undefined {
  return modelId ? helmet3dModels[modelId] : undefined
}

/** The first of a product's helmets that has a 3D model. */
export function first3dModel(modelIds: HelmetModelId[]): { id: HelmetModelId; model: Helmet3dModel } | undefined {
  for (const id of modelIds) {
    const model = helmet3dModels[id]
    if (model) return { id, model }
  }
  return undefined
}
