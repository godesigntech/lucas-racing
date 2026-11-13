export interface HelmetTemplateArtwork {
  graphicMask: string
  accentMask: string
  thumbnail: string
}

const slugs = ["emilio", "nygel", "rusinov", "pink-blade", "navy-pink", "ivory-gold", "neon-volt", "tricolore", "inferno", "strike-red", "red-fury", "sky-racer", "gold-line", "yellow-flash", "crimson-bolt", "cobalt-storm"]

/**
 * Template artwork per helmet. The Bell KC7's is drawn by the designers; the Arai SK-6's
 * is moved across from it by scripts/prepare-sk6-templates.mjs, in the SK-6's own UVs.
 */
const models = ["bell-kc7", "arai-sk6"]
const templates: Record<string, HelmetTemplateArtwork> = Object.fromEntries(
  models.flatMap((modelId) =>
    slugs.map((slug) => {
      const path = `/models/templates/${modelId}/${slug}`
      return [`${modelId}/${slug}`, { graphicMask: `${path}/graphic-mask.png`, accentMask: `${path}/accent-mask.png`, thumbnail: `${path}/thumbnail.png` }]
    }),
  ),
)

/** Artwork is tied to this exact model's UVs and product, not just a layout name. */
export function getTemplateArtwork(modelId: string, templateSlug: string): HelmetTemplateArtwork | undefined {
  return templates[`${modelId}/${templateSlug}`]
}
