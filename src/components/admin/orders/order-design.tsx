"use client"

import { useMemo } from "react"

import { helmetFont } from "@/components/helmet-3d/helmet-fonts"
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

const placementNames: Record<string, string> = { sides: "Both sides", left: "Left side", right: "Right side", front: "Front", back: "Back", top: "Top" }

/** "Moved right 20%, up 10%" for an item's fine position, or nothing when it's centred. */
function nudgeText(x = 0, y = 0): string {
  const parts = [
    x ? `${x > 0 ? "right" : "left"} ${Math.round(Math.abs(x) * 100)}%` : "",
    y ? `${y > 0 ? "down" : "up"} ${Math.round(Math.abs(y) * 100)}%` : "",
  ].filter(Boolean)
  return parts.length ? `moved ${parts.join(", ")}` : ""
}

/**
 * How each name, number and logo is lettered and placed: fonts, styles, colours,
 * outlines and fine positions, which the order summary doesn't record.
 */
function LetteringDetails({ config }: { config: HelmetConfiguration }) {
  const texts = (config.personalisation ?? []).filter((item) => item.value.trim())
  const logos = config.logos ?? []
  if (texts.length === 0 && logos.length === 0) return null
  const line = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" · ")
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Lettering and logos</h3>
      <ul className="divide-y divide-carbon/10 rounded-2xl border border-carbon/10 text-sm">
        {texts.map((item, index) => {
          const font = helmetFont(item.font)
          return (
            <li key={`text-${index}`} className="space-y-0.5 px-4 py-2">
              <p className="font-medium">
                {item.value} <span className="font-normal text-muted-foreground">({item.kind})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {line(
                  placementNames[item.position] ?? item.position,
                  nudgeText(item.offsetX, item.offsetY),
                  item.kind !== "flag" && `font ${font.label}`,
                  item.bold && "bold",
                  (item.italic ?? font.italic) && "italic",
                  item.colour && `colour ${item.colour}`,
                  item.outline && (item.outlineWidth ?? 0) > 0 && `outline ${item.outline} (${Math.round((item.outlineWidth ?? 0) * 100)}%)`,
                  item.letterSpacing ? `spacing ${item.letterSpacing}em` : "",
                  `size ${item.scale ?? 1}×`,
                  item.rotation ? `angle ${item.rotation}°` : "",
                )}
              </p>
            </li>
          )
        })}
        {logos.map((logo, index) => (
          <li key={logo.path} className="space-y-0.5 px-4 py-2">
            <p className="font-medium">Logo {index + 1}</p>
            <p className="text-xs text-muted-foreground">
              {line(placementNames[logo.position] ?? logo.position, nudgeText(logo.offsetX, logo.offsetY), `size ${logo.scale ?? 1}×`, logo.rotation ? `angle ${logo.rotation}°` : "")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
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
      <div className="space-y-5">
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
        <LetteringDetails config={config} />
      </div>
    </div>
  )
}
