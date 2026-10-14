import { productCategories } from "@/data/categories"
import type { ProductCategory, ProductCategoryId } from "@/types/product"

export function getCategory(id: ProductCategoryId): ProductCategory {
  const category = productCategories.find((item) => item.id === id)
  if (!category) throw new Error(`Unknown product category: ${id}`)
  return category
}
