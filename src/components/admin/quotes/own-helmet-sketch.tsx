import { AdminCard } from "@/components/admin/admin-card"
import { OrderDesign } from "@/components/admin/orders/order-design"
import { normaliseConfiguration } from "@/lib/configurator/helmet-configuration"
import { getBuilderCatalog } from "@/lib/data/builder"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { DESIGN_VIEWS, designViewLabels } from "@/lib/own-helmet/design-reference"
import type { OwnHelmetSketch } from "@/types/design-assistant"

/**
 * The design an own-helmet customer sketched in the 3D builder, as a reference for the
 * workshop: pictures of it from four sides, then the design itself in 3D with every choice.
 */
export async function OwnHelmetSketchCard({
  sketch,
  imageUrls,
  designImageUrls,
}: {
  sketch: OwnHelmetSketch
  /** Signed links to the pictures, in DESIGN_VIEWS order. */
  imageUrls: string[]
  /** Signed links to images and prints used in the design, by storage path. */
  designImageUrls: Record<string, string>
}) {
  const [products, priceBook, builder] = await Promise.all([getProducts(), getPriceBook(), getBuilderCatalog()])
  const product = products.find((item) => item.slug === sketch.slug)

  return (
    <AdminCard
      title={`Their 3D sketch: ${sketch.name || sketch.slug}`}
      description="A reference the customer made in the builder, not an order. Pictures link to full size for an hour; reload to refresh them."
    >
      {imageUrls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {imageUrls.map((url, index) => {
            const label = designViewLabels[DESIGN_VIEWS[index] ?? "angle"]
            return (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-carbon/5 ring-1 ring-carbon/10 transition hover:ring-carbon/30">
                  {/* Signed, short-lived link to a private picture. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${label} view of the customer's 3D sketch`} className="aspect-[4/3] w-full object-cover" />
                </a>
                <p className="mt-1 text-center text-xs text-muted-foreground">{label}</p>
              </li>
            )
          })}
        </ul>
      )}
      <div className={imageUrls.length > 0 ? "mt-6 border-t border-carbon/10 pt-6" : undefined}>
        {product ? (
          <OrderDesign
            product={product}
            config={normaliseConfiguration(sketch.config, product, priceBook)}
            priceBook={priceBook}
            templates={builder.templates}
            aeroKits={builder.aeroKits}
            visors={builder.visors}
            logoUrls={designImageUrls}
            summary={sketch.summary}
          />
        ) : (
          <p className="text-sm text-muted-foreground">The template &ldquo;{sketch.slug}&rdquo; is no longer in the catalogue, so the 3D view can&apos;t be shown.</p>
        )}
      </div>
    </AdminCard>
  )
}
