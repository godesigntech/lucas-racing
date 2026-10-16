import {
  importProductSchema,
  type ImportProduct,
  type ImportRowError,
} from "@/lib/validations/shop-import"

// Turns a supplier CSV (already parsed into rows) into products ready to import.
// Runs in the browser, so the server only ever receives checked, grouped products.

export type FieldKey =
  | "externalId"
  | "title"
  | "price"
  | "description"
  | "brand"
  | "category"
  | "subcategory"
  | "images"
  | "group"
  | "optionValue"
  | "sku"
  | "stock"
  | "weight"

export const fields: { key: FieldKey; label: string; hint?: string; required?: boolean; guesses: string[] }[] = [
  {
    key: "externalId",
    label: "Product ID or part number",
    hint: "The supplier's code. It's how a product is recognised next time you import.",
    required: true,
    guesses: ["id", "product id", "part number", "part no", "partno", "item code", "code", "external id", "sku"],
  },
  { key: "title", label: "Name", required: true, guesses: ["title", "name", "product name", "product title"] },
  { key: "price", label: "Price (£)", required: true, guesses: ["price", "rrp", "retail price", "price inc vat", "selling price", "price gbp"] },
  { key: "description", label: "Description", guesses: ["description", "long description", "details", "body"] },
  { key: "brand", label: "Brand", guesses: ["brand", "manufacturer", "make"] },
  { key: "category", label: "Category", guesses: ["category", "category name", "main category"] },
  { key: "subcategory", label: "Subcategory", guesses: ["subcategory", "sub category", "sub-category"] },
  { key: "images", label: "Image links", hint: "One or more web links, separated by | , or ;", guesses: ["image", "images", "image url", "image urls", "image link", "image links", "picture", "photo"] },
  {
    key: "group",
    label: "Group rows into one product by",
    hint: "Rows with the same value here become one product with options, such as sizes.",
    guesses: ["group", "parent", "parent id", "parent sku", "product group", "group id", "style"],
  },
  { key: "optionValue", label: "Option value", hint: "For example the size on each row.", guesses: ["size", "option", "variant", "colour", "color"] },
  { key: "sku", label: "Option part number", guesses: ["variant sku", "option code", "variant code", "barcode", "ean"] },
  {
    key: "stock",
    label: "Opening stock",
    hint: "Only used for new products. Stock you count yourself is never overwritten.",
    guesses: ["stock", "qty", "quantity", "stock level", "in stock"],
  },
  { key: "weight", label: "Weight (grams)", guesses: ["weight", "weight g", "weight grams", "grams"] },
]

export type Mapping = Partial<Record<FieldKey, string>>

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

export function guessMapping(headers: string[]): Mapping {
  const mapping: Mapping = {}
  const used = new Set<string>()
  for (const field of fields) {
    const header = headers.find((candidate) => !used.has(candidate) && field.guesses.includes(normalise(candidate)))
    if (header) {
      mapping[field.key] = header
      used.add(header)
    }
  }
  return mapping
}

export function parsePrice(value: string): number {
  const cleaned = value.replace(/[£$€,\s]/g, "")
  if (!cleaned) return Number.NaN
  return Math.round(Number(cleaned) * 100) / 100
}

export function parseWhole(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, "")
  if (!cleaned) return null
  const number = Math.round(Number(cleaned))
  return Number.isFinite(number) && number >= 0 ? number : null
}

const fieldNames: Record<string, string> = {
  externalId: "Product ID",
  title: "Name",
  description: "Description",
  brand: "Brand",
  category: "Category",
  images: "Image links",
  variants: "Options",
}

/** Turns CSV rows into products, grouping rows into options when a group column is chosen. */
export function buildProducts(rows: Record<string, string>[], mapping: Mapping, optionName: string) {
  const get = (row: Record<string, string>, key: FieldKey) => (mapping[key] ? String(row[mapping[key]!] ?? "").trim() : "")
  const errors: ImportRowError[] = []
  const groups = new Map<string, { row: number; data: Record<string, string> }[]>()

  rows.forEach((data, index) => {
    const row = index + 2 // the header is row 1
    const id = get(data, "externalId")
    if (!id) {
      if (Object.values(data).some((value) => String(value ?? "").trim())) errors.push({ row, message: "No product ID or part number." })
      return
    }
    const key = (mapping.group && get(data, "group")) || id
    const group = groups.get(key)
    if (group) group.push({ row, data })
    else groups.set(key, [{ row, data }])
  })

  const products: ImportProduct[] = []
  for (const [key, members] of groups) {
    const first = members[0].data
    const images = new Set<string>()
    for (const { data } of members) {
      for (const link of get(data, "images").split(/[|,;\s]+/)) {
        if (/^https?:\/\/\S+$/.test(link) && images.size < 12) images.add(link)
      }
    }

    const variants: ImportProduct["variants"] = []
    const seen = new Set<string>()
    for (const { row, data } of members) {
      const price = parsePrice(get(data, "price"))
      if (!Number.isFinite(price) || price < 0) {
        errors.push({ row, message: "The price is missing or isn't a number." })
        continue
      }
      const id = get(data, "externalId")
      const sku = (get(data, "sku") || id).slice(0, 60)
      const optionValue = (get(data, "optionValue") || (members.length > 1 ? sku || id : "")).slice(0, 60)
      const variantKey = (optionValue || sku).toLowerCase()
      if (seen.has(variantKey)) {
        errors.push({ row, message: `The option "${optionValue || sku}" appears twice for this product, so this row was skipped.` })
        continue
      }
      seen.add(variantKey)
      variants.push({
        row,
        sku,
        optionValue,
        price,
        stock: parseWhole(get(data, "stock")),
        weightGrams: parseWhole(get(data, "weight")),
      })
    }
    if (variants.length === 0) continue
    if (variants.length > 1 && !optionName) {
      errors.push({ row: members[0].row, message: "This product has several options. Name the option (for example Size) above." })
      continue
    }

    const product: ImportProduct = {
      externalId: key.slice(0, 120),
      title: get(first, "title").slice(0, 160),
      description: get(first, "description").slice(0, 8000),
      brand: get(first, "brand").slice(0, 80),
      category: [get(first, "category"), get(first, "subcategory")].filter(Boolean).join(" > ").slice(0, 160),
      images: [...images],
      variants: variants.slice(0, 100),
    }
    const parsed = importProductSchema.safeParse(product)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const field = fieldNames[String(issue.path[0])] ?? "This row"
      errors.push({ row: members[0].row, message: `${field}: ${issue.message}` })
      continue
    }
    products.push(parsed.data)
  }
  return { products, errors }
}

export function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}
