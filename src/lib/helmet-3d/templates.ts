export interface HelmetTemplateArtwork {
  graphicMask: string
  accentMask: string
  thumbnail: string
}

const shared = ["emilio", "nygel", "rusinov", "pink-blade", "navy-pink", "ivory-gold", "neon-volt", "tricolore", "inferno", "strike-red", "red-fury", "sky-racer", "gold-line", "yellow-flash", "crimson-bolt", "hornet", "blue-arrow"]

/**
 * Template artwork each helmet has in /public/models/templates/<model>/<slug>/. Only list
 * a design once its files are there, or its picture shows as a broken image. Designs are
 * moved between helmets by scripts/prepare-sk6-templates.mjs (--to-bell for SK-6 designs).
 */
const available: Record<string, string[]> = {
  "bell-kc7": [...shared, "cobalt-storm"],
  "arai-sk6": shared,
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
