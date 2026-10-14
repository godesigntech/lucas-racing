import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { productCategories } from "@/data/categories"
import { demoFilms, demoModels, demoOptions, demoProducts } from "@/lib/demo/catalog"
import { isDemoMode } from "@/lib/demo/mode"
import { createPublicClient } from "@/lib/supabase/server"
import { toFilm, toHelmetModel, toOption, toProduct } from "@/lib/supabase/mappers"
import { optionGroupKeys, type ConfiguratorOption, type Film, type OptionGroupKey, type PriceBook } from "@/types/catalog"
import type { HelmetModel } from "@/types/helmet"
import type { CatalogProduct, Product, ProductCategory } from "@/types/product"

import { cacheTags } from "./cache-tags"

interface Catalog {
  products: CatalogProduct[]
  priceBook: PriceBook
}

/**
 * The whole public catalogue in one cached read. Admin changes call
 * updateTag("catalog"), so the site shows new prices straight away.
 */
async function getCatalog(): Promise<Catalog> {
  "use cache"
  cacheTag(cacheTags.catalog)
  cacheLife("hours")

  if (isDemoMode()) return buildCatalog(demoProducts, demoModels, demoFilms, demoOptions)

  const supabase = createPublicClient()
  const [products, models, films, options] = await Promise.all([
    supabase.from("products").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("helmet_models").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("films").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("configurator_options").select("*").eq("is_active", true).order("sort_order"),
  ])

  const error = products.error ?? models.error ?? films.error ?? options.error
  if (error) throw new Error(`Could not load the catalogue: ${error.message}`)

  return buildCatalog(
    (products.data ?? []).map(toProduct),
    (models.data ?? []).map(toHelmetModel),
    (films.data ?? []).map(toFilm),
    (options.data ?? []).map(toOption),
  )
}

function buildCatalog(products: Product[], helmetModels: HelmetModel[], films: Film[], options: ConfiguratorOption[]): Catalog {
  const grouped = Object.fromEntries(optionGroupKeys.map((key) => [key, []])) as unknown as PriceBook["options"]
  for (const option of options) grouped[option.group as OptionGroupKey].push(option)

  return {
    products: products.map((product) => ({
      ...product,
      // Keep the product's model order but drop any model that's been switched off.
      models: product.models.filter((id) => helmetModels.some((model) => model.id === id)),
      availableModels: helmetModels
        .filter((model) => product.models.includes(model.id))
        .map(({ id, name, shortName, summary }) => ({ id, name, shortName, summary })),
    })),
    priceBook: { models: helmetModels, films, options: grouped },
  }
}

export async function getProducts(): Promise<CatalogProduct[]> {
  return (await getCatalog()).products
}

export async function getPriceBook(): Promise<PriceBook> {
  return (await getCatalog()).priceBook
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  return (await getProducts()).find((product) => product.slug === slug)
}

export async function getFeaturedProducts(limit = 4): Promise<CatalogProduct[]> {
  return (await getProducts()).filter((product) => product.badge).slice(0, limit)
}

export async function getRelatedProducts(product: CatalogProduct, limit = 3): Promise<CatalogProduct[]> {
  const products = await getProducts()
  const sameCategory = products.filter((item) => item.slug !== product.slug && item.category === product.category)
  const others = products.filter((item) => item.slug !== product.slug && item.category !== product.category)
  return [...sameCategory, ...others].slice(0, limit)
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  return productCategories
}
