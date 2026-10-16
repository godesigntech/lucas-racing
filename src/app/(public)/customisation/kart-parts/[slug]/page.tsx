import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { KartPartsBrand } from "@/components/kart-parts/kart-parts-brand"
import { PreviewNotice } from "@/components/kart-parts/preview-notice"
import { Container } from "@/components/layout/container"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { AddToBasket } from "@/components/shop/add-to-basket"
import { ShopProductGallery } from "@/components/shop/product-gallery"
import { Skeleton } from "@/components/ui/skeleton"
import { getPriceBook } from "@/lib/data/products"
import { canSeeKartParts, getShopProductBySlug } from "@/lib/data/shop"
import { isCustomisable } from "@/lib/shop/part-finish"

export const metadata: Metadata = {
  title: "MS Kart parts by HydroKarts",
}

export default function CustomPartPage({ params }: PageProps<"/customisation/kart-parts/[slug]">) {
  return (
    <Suspense fallback={<PartSkeleton />}>
      {params.then(({ slug }) => (
        <CustomPart slug={slug} />
      ))}
    </Suspense>
  )
}

async function CustomPart({ slug }: { slug: string }) {
  const [access, product, priceBook] = await Promise.all([canSeeKartParts(), getShopProductBySlug(slug), getPriceBook()])
  // Hidden like the rest of the section until the branding is approved.
  if (!access.visible || !product || product.storeId !== "hydrokarts-parts" || !isCustomisable(product)) notFound()

  return (
    <>
      {access.preview && <PreviewNotice />}
      <section className="py-10 sm:py-14">
        <Container className="space-y-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Customisation", href: "/customisation" },
              { label: "Kart parts", href: "/customisation/kart-parts" },
              { label: product.title },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              <ShopProductGallery images={product.images} title={product.title} />
            </div>
            <div className="space-y-6">
              <KartPartsBrand className="px-4 py-2.5 [&_img]:h-8 sm:[&_img]:h-9" />
              <div className="space-y-2">
                {product.brand && <p className="eyebrow text-brand-ink">{product.brand}</p>}
                <h1 className="display text-5xl sm:text-6xl">{product.title}</h1>
              </div>
              <AddToBasket product={product} priceBook={priceBook} />
              {product.description && (
                <div className="space-y-3 border-t border-carbon/10 pt-6">
                  <h2 className="font-display text-2xl font-bold uppercase">Description</h2>
                  <p className="whitespace-pre-line leading-relaxed text-carbon/80">{product.description}</p>
                </div>
              )}
              {product.specs.length > 0 && (
                <div className="space-y-3 border-t border-carbon/10 pt-6">
                  <h2 className="font-display text-2xl font-bold uppercase">Specifications</h2>
                  <dl className="divide-y divide-carbon/10 text-sm">
                    {product.specs.map((spec) => (
                      <div key={spec.label} className="flex justify-between gap-4 py-2">
                        <dt className="text-muted-foreground">{spec.label}</dt>
                        <dd className="text-right font-medium">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

function PartSkeleton() {
  return (
    <Container className="grid gap-10 py-14 lg:grid-cols-2" aria-busy="true" aria-label="Loading the part">
      <Skeleton className="aspect-square rounded-[2rem]" />
      <div className="space-y-4">
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    </Container>
  )
}
