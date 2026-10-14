import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { Badge } from "@/components/ui/badge"
import { getCategory } from "@/lib/catalog/categories"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CatalogProduct } from "@/types/product"

interface ProductCardProps {
  product: CatalogProduct
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const category = getCategory(product.category)

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-carbon/10 bg-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-carbon/20 hover:shadow-[0_24px_48px_-28px_rgb(17_20_18/0.45)] focus-within:ring-3 focus-within:ring-ring/40",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_70%)]">
        <div className="absolute inset-0 flex items-center justify-center p-6 transition-transform duration-500 ease-out group-hover:scale-[1.04]">
          <HelmetArt look={product.look} className="max-h-full" />
        </div>
        {product.badge && (
          <Badge className="absolute left-4 top-4 h-6 rounded-full bg-carbon px-3 text-[0.7rem] text-paper">
            {product.badge}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow text-lime-ink">{category.label}</span>
          <span className="font-mono text-[0.7rem] text-muted-foreground">
            {product.availableModels.map((model) => model.shortName).join(" · ")}
          </span>
        </div>
        <h3 className="font-display text-3xl font-bold uppercase leading-none">
          <Link
            href={`/products/${product.slug}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{product.tagline}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-sm font-semibold">{formatPrice(product.startingPrice)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-carbon">
            View details
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </article>
  )
}
