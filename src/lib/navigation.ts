import { mainNav, type NavGroup } from "@/constants/navigation"
import type { ShopCategory } from "@/types/shop"

/**
 * The main menu with the MS Kart Shop dropdown listing the shop's current
 * top-level categories, so new categories appear without a code change.
 */
export function navWithShopCategories(categories: ShopCategory[]): NavGroup[] {
  const topLevel = categories.filter((category) => category.storeId === "ms-kart" && !category.parentId)
  if (topLevel.length === 0) return mainNav
  return mainNav.map((item) =>
    item.href === "/shop"
      ? {
          ...item,
          children: [
            { label: "Shop all", href: "/shop", description: "Karts, parts and accessories from the UK home of MS Kart" },
            ...topLevel.map((category) => ({
              label: category.name,
              href: `/shop/${category.slug}`,
              description: category.description || undefined,
            })),
          ],
        }
      : item,
  )
}
