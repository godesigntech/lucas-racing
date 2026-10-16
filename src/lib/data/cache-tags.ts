/** Cache tags for `use cache` reads; Server Actions call updateTag() with these after writes. */
export const cacheTags = {
  catalog: "catalog",
  settings: "settings",
  team: "team",
} as const
