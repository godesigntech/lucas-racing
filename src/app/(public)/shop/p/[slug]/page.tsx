import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"

import { Container } from "@/components/layout/container"
import { AddToBasket } from "@/components/shop/add-to-basket"
import { ShopProductGallery } from "@/components/shop/product-gallery"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getShopProductBySlug } from "@/lib/data/shop"
import type { StoreId } from "@/types/shop"

const storePages: Record<StoreId, { label: string; href: string }> = {
  "ms-kart": { label: "MS Kart shop", href: "/shop" },
  teamwear: { label: "Teamwear", href: "/teamwear" },
  "hydrokarts-parts": { label: "MS Kart parts by HydroKarts", href: "/customisation/kart-parts" },
  delta: { label: "Delta Racewear", href: "/racewear" },
}

export async function generateMetadata({ params }: PageProps<"/shop/p/[slug]">): Promise<Metadata> {
  const product = await getShopProductBySlug((await params).slug)
  if (!product) return { title: "Product not found" }
  return {
    title: product.title,
    description: product.description.slice(0, 160) || `${product.title} from Lucas Racing.`,
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  }
}

export default function ShopProductPage({ params }: PageProps<"/shop/p/[slug]">) {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <Suspense fallback={<ProductSkeleton />}>
          {params.then(({ slug }) => (
            <ProductView slug={slug} />
          ))}
        </Suspense>
      </Container>
    </section>
  )
}

async function ProductView({ slug }: { slug: string }) {
  const product = await getShopProductBySlug(slug)
  if (!product) notFound()
  const store = storePages[product.storeId]

  return (
    <div className="space-y-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-carbon">Home</Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href={store.href} className="hover:text-carbon">{store.label}</Link>
          </li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="font-medium text-carbon">{product.title}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ShopProductGallery images={product.images} title={product.title} />
        <div className="space-y-6">
          <div className="space-y-2">
            {product.brand && <p className="eyebrow text-brand-ink">{product.brand}</p>}
            <h1 className="display text-5xl sm:text-6xl">{product.title}</h1>
          </div>
          {product.storeId === "delta" ? (
            product.externalUrl && (
              <Button asChild size="lg">
                <a href={product.externalUrl} target="_blank" rel="noreferrer">
                  Customise and order at Delta <ExternalLink />
                </a>
              </Button>
            )
          ) : (
            <AddToBasket product={product} />
          )}
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
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2" aria-busy="true" aria-label="Loading the product">
      <Skeleton className="aspect-square rounded-[2rem]" />
      <div className="space-y-4">
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  )
}
