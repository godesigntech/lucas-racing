import Link from "next/link"
import { ArrowDown, MessageSquare } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCategory, getHelmetModels } from "@/lib/data/products"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/types/product"

export function ProductSummary({ product }: { product: Product }) {
  const category = getCategory(product.category)
  const models = getHelmetModels(product.models)

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="h-7 rounded-full border-carbon/20 px-3 text-xs">
          {category.label}
        </Badge>
        {product.badge && <Badge className="h-7 rounded-full bg-carbon px-3 text-xs text-paper">{product.badge}</Badge>}
      </div>

      <div className="space-y-3">
        <h1 className="display text-6xl sm:text-7xl">{product.name}</h1>
        <p className="text-lg text-muted-foreground">{product.tagline}</p>
      </div>

      <div className="flex items-baseline gap-3 border-y border-carbon/10 py-5">
        <span className="font-display text-4xl font-bold uppercase">{formatPrice(product.startingPrice)}</span>
        <span className="text-sm text-muted-foreground">customisation, sample pricing</span>
      </div>

      <p className="leading-relaxed text-carbon/80">{product.description}</p>

      <div>
        <p className="eyebrow mb-3 text-muted-foreground">Available on</p>
        <ul className="flex flex-wrap gap-2">
          {models.map((model) => (
            <li key={model.id} className="rounded-2xl border border-carbon/10 bg-card px-4 py-3">
              <p className="font-semibold">{model.name}</p>
              <p className="text-xs text-muted-foreground">{model.summary}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="#configure">
            Configure this design <ArrowDown />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={`/contact?design=${product.slug}`}>
            <MessageSquare /> Ask the workshop
          </Link>
        </Button>
      </div>
    </div>
  )
}
