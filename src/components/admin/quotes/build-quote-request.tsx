import { AdminCard } from "@/components/admin/admin-card"
import { OrderDesign } from "@/components/admin/orders/order-design"
import { getBuilderCatalog } from "@/lib/data/builder"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { calculateHelmetPrice, normaliseConfiguration } from "@/lib/configurator/helmet-configuration"
import { chromeBaseCoatPrice, quoteReasons } from "@/lib/configurator/pricing-rules"
import { resolveRegions } from "@/lib/configurator/regions"
import { formatDateTime, formatMoney } from "@/lib/format"
import type { QuoteRequest } from "@/types/design-assistant"

import { QuotePriceForm } from "./quote-price-form"

/** A bespoke build from the builder: the design in 3D, why it needs pricing, and the price form. */
export async function BuildQuoteRequest({ quote, imageUrls }: { quote: QuoteRequest; imageUrls: Record<string, string> }) {
  const build = quote.build
  if (!build) return null
  const [products, priceBook, builder] = await Promise.all([getProducts(), getPriceBook(), getBuilderCatalog()])
  const product = products.find((item) => item.slug === build.slug)
  if (!product) {
    return (
      <AdminCard title="Helmet design">
        <p className="text-sm text-muted-foreground">The template &ldquo;{build.slug}&rdquo; is no longer in the catalogue, so the 3D view can&apos;t be shown.</p>
      </AdminCard>
    )
  }
  const config = normaliseConfiguration(build.config, product, priceBook)
  const reasons = quoteReasons(config, priceBook)
  const regions = resolveRegions(product, config.model, builder.templates).map(({ key, label, kind, coverage }) => ({ key, label, kind, coverage }))
  const standard = calculateHelmetPrice(product, config, priceBook, { regions, aeroKits: builder.aeroKits, visors: builder.visors })

  return (
    <>
      <AdminCard title={`Helmet design: ${build.name || product.name}`} description="Exactly as the customer designed it. Drag to turn the helmet, or pick an angle.">
        <OrderDesign
          product={product}
          config={config}
          priceBook={priceBook}
          templates={builder.templates}
          aeroKits={builder.aeroKits}
          visors={builder.visors}
          logoUrls={imageUrls}
          summary={build.summary}
        />
      </AdminCard>
      <AdminCard
        title="Price this design"
        description={reasons.length ? `Needs pricing because of: ${reasons.join(", ").toLowerCase()}.` : "Bespoke design."}
      >
        {quote.quotedPrice !== null && (
          <p className="mb-4 rounded-xl bg-accent p-3 text-sm text-accent-foreground">
            Sent {formatMoney(quote.quotedPrice)} (deposit {formatMoney(quote.quotedDeposit ?? 0)}){quote.quotedAt ? ` on ${formatDateTime(quote.quotedAt)}` : ""}.
          </p>
        )}
        <QuotePriceForm id={quote.id} chrome={config.baseCoat === "chrome"} chromePrice={chromeBaseCoatPrice(priceBook)} pricedSoFar={standard?.total ?? null} quotedPrice={quote.quotedPrice} />
      </AdminCard>
    </>
  )
}
