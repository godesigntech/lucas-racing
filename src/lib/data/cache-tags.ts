/** Cache tags for `use cache` reads; Server Actions call updateTag() with these after writes. */
export const cacheTags = {
  catalog: "catalog",
  settings: "settings",
  team: "team",
  shop: "shop",
  news: "news",
  gallery: "gallery",
  /** Design templates and their editable regions. */
  templates: "templates",
  /** Production settings, capacity, blackouts and rush tiers. */
  production: "production",
} as const
