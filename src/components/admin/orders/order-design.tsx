"use client"

import { useMemo } from "react"

import { StudioPreview } from "@/components/studio/studio-preview"
import { getCategory } from "@/lib/catalog/categories"
import { configurationToLook } from "@/lib/configurator/helmet-configuration"
import { resolveRegions } from "@/lib/configurator/regions"
import { buildSceneDesign } from "@/lib/configurator/scene-design"
import type { PriceBook } from "@/types/catalog"
import type { HelmetConfiguration } from "@/types/configurator"
import type { OrderSummaryLine } from "@/types/order"
import type { CatalogProduct } from "@/types/product"
import type { AeroKit, DesignTemplate, Visor } from "@/types/templates"

interface OrderDesignProps {
  product: CatalogProduct
  config: HelmetConfiguration
  priceBook: PriceBook
  templates: DesignTemplate[]
  aeroKits: AeroKit[]
  visors: Visor[]
  /** Signed links to the customer's logos, by storage path. */
  logoUrls: Record<string, string>
  /** Everything the customer chose, as recorded when the order was placed. */
  summary: OrderSummaryLine[]
}

/**
 * The customer's helmet as they designed it, for the workshop: the same 3D preview
 * the builder shows (template, colours, finishes, films, text, logos, visor and aero),
 * without the "unpaid preview" stamp, next to the full specification.
 */
export function OrderDesign({ product, config, priceBook, templates, aeroKits, visors, logoUrls, summary }: OrderDesignProps) {
  const regions = useMemo(() => resolveRegions(product, config.model, templates), [product, config.model, templates])
  const look = useMemo(() => configurationToLook(product, config, priceBook), [product, config, priceBook])
  const design = useMemo(() => buildSceneDesign(config, regions, priceBook, logoUrls), [config, regions, priceBook, logoUrls])
  const visor = visors.find((item) => item.id === config.visor) ?? null
  const aeroMesh = aeroKits.find((kit) => kit.id === config.aero)?.meshName ?? null
  const model = priceBook.models.find((item) => item.id === config.model)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
      <StudioPreview
        look={look}
        modelId={config.model}
        templateSlug={product.slug}
        modelName={model?.name ?? "Helmet"}
        designLabel={`${getCategory(product.category).label} · ${product.name}`}
        design={design}
        visor={visor}
        aeroMesh={aeroMesh}
        eyebrow="Customer's design"
        watermark={false}
      />
      <div>
        <h3 className="mb-3 text-sm font-semibold">Full specification</h3>
        <dl className="divide-y divide-carbon/10 rounded-2xl border border-carbon/10 text-sm">
          {summary.map((line, index) => (
            <div key={`${line.label}-${index}`} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-4 py-2">
              <dt className="text-muted-foreground">{line.label}</dt>
              <dd className="break-words font-medium">{line.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
