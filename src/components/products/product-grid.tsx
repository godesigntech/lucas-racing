import { cn } from "@/lib/utils"
import type { Product } from "@/types/product"

import { ProductCard } from "./product-card"

interface ProductGridProps {
  products: Product[]
  columns?: 3 | 4
  className?: string
}

export function ProductGrid({ products, columns = 3, className }: ProductGridProps) {
  return (
    <ul
      className={cn(
        "grid gap-5 sm:grid-cols-2 lg:gap-6",
        columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.slug} className="flex">
          <ProductCard product={product} className="w-full" />
        </li>
      ))}
    </ul>
  )
}
