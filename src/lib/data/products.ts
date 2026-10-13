import { productCategories } from "@/data/categories"
import { helmetModels } from "@/data/helmet-models"
import { products } from "@/data/products"
import type { HelmetModel, HelmetModelId } from "@/types/helmet"
import type { Product, ProductCategory, ProductCategoryId } from "@/types/product"

// Data-access layer. Pages call these functions instead of importing the mock
// arrays, so they can switch to Supabase or an API later without UI changes.

export async function getProducts(): Promise<Product[]> {
  return products
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return products.find((product) => product.slug === slug)
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return products.filter((product) => product.badge).slice(0, limit)
}

export async function getRelatedProducts(product: Product, limit = 3): Promise<Product[]> {
  const sameCategory = products.filter(
    (candidate) => candidate.slug !== product.slug && candidate.category === product.category,
  )
  const others = products.filter(
    (candidate) => candidate.slug !== product.slug && candidate.category !== product.category,
  )
  return [...sameCategory, ...others].slice(0, limit)
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  return productCategories
}

export function getCategory(id: ProductCategoryId): ProductCategory {
  const category = productCategories.find((item) => item.id === id)
  if (!category) throw new Error(`Unknown product category: ${id}`)
  return category
}

export function getHelmetModels(ids?: HelmetModelId[]): HelmetModel[] {
  return ids ? helmetModels.filter((model) => ids.includes(model.id)) : helmetModels
}
