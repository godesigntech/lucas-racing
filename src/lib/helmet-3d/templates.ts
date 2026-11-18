export interface HelmetTemplateArtwork {
  graphicMask: string
  accentMask: string
  thumbnail: string
}

/**
 * Template artwork each helmet has in /public/models/templates/<model>/<slug>/. Each helmet
 * has its own designs (the client's choice): the Bell KC7's from scripts/prepare-artwork-
 * templates.mjs, the Arai SK-6's from scripts/prepare-sk6-artwork.mjs. Only list a design
 * once its files are there, or its picture shows as a broken image.
 */
const available: Record<string, string[]> = {
  "bell-kc7": ["emilio", "rusinov", "pink-blade", "navy-pink", "ivory-gold", "neon-volt", "tricolore", "inferno", "strike-red", "red-fury", "sky-racer", "gold-line", "yellow-flash", "crimson-bolt", "hornet", "blue-arrow", "cobalt-storm"],
  "arai-sk6": ["navy-lime", "electric-blue", "red-silver", "red-yellow", "blue-current", "crimson-apex", "jade-circuit", "magenta-vector", "amber-vortex", "arctic-spear"],
}
const templates: Record<string, HelmetTemplateArtwork> = Object.fromEntries(
  Object.entries(available).flatMap(([modelId, slugs]) =>
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
