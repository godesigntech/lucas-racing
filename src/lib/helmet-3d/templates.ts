export interface HelmetTemplateArtwork {
  graphicMask: string
  accentMask: string
  thumbnail: string
}

const templates: Record<string, HelmetTemplateArtwork> = Object.fromEntries(
  ["apex", "twin-stripe", "split-tone", "shard", "forged-flow", "chrome-strike"].map((slug) => {
    const path = `/models/templates/bell-kc7/${slug}`
    return [slug, { graphicMask: `${path}/graphic-mask.png`, accentMask: `${path}/accent-mask.png`, thumbnail: `${path}/thumbnail.png` }]
  }),
)

/** Artwork is tied to this exact model's UVs and product, not just a layout name. */
export function getTemplateArtwork(modelId: string, templateSlug: string): HelmetTemplateArtwork | undefined {
  return modelId === "bell-kc7" ? templates[templateSlug] : undefined
}
