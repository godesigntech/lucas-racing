import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink, MessageCircle } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { ShopProductGallery } from "@/components/shop/product-gallery"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getShopProductBySlug } from "@/lib/data/shop"
import { formatMoney } from "@/lib/format"

export async function generateMetadata({ params }: PageProps<"/racewear/[slug]">): Promise<Metadata> {
  const product = await getShopProductBySlug((await params).slug)
  if (!product || product.storeId !== "delta") return { title: "Suit not found" }
  return {
    title: `${product.title} | Delta Racewear`,
    description: product.description.slice(0, 160) || `${product.title} from Delta Racewear, available through Lucas Racing.`,
    alternates: { canonical: `/racewear/${product.slug}` },
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  }
}

export default function RacewearProductPage({ params }: PageProps<"/racewear/[slug]">) {
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <Suspense fallback={<Skeleton className="h-[32rem] rounded-[2rem]" />}>
          {params.then(({ slug }) => (
            <Suit slug={slug} />
          ))}
        </Suspense>
      </Container>
    </section>
  )
}

async function Suit({ slug }: { slug: string }) {
  const product = await getShopProductBySlug(slug)
  if (!product || product.storeId !== "delta") notFound()
  const prices = product.variants.map((variant) => variant.price).filter((price) => price > 0)
  const from = prices.length ? Math.min(...prices) : null

  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Delta Racewear", href: "/racewear" }, { label: product.title }]} />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ShopProductGallery images={product.images} title={product.title} />
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="eyebrow text-brand-ink">Delta Racewear · available through Lucas Racing</p>
            <h1 className="display text-5xl sm:text-6xl">{product.title}</h1>
          </div>
          {from !== null && (
            <p className="font-display text-4xl font-bold">
              <span className="mr-2 align-middle text-base font-medium text-muted-foreground">From</span>
              {formatMoney(from)}
            </p>
          )}
          <div className="space-y-3 rounded-3xl bg-carbon p-5 text-paper">
            <p className="text-sm text-paper/75">
              Choose your colours and design, and place your order, on Delta Racewear&apos;s website. Delta makes and delivers your suit.
            </p>
            {product.externalUrl ? (
              <Button asChild size="lg" className="w-full">
                <a href={`/racewear/go/${product.slug}`} target="_blank" rel="noopener nofollow">
                  Customise and order at Delta <ExternalLink />
                </a>
              </Button>
            ) : (
              <p className="text-sm font-medium text-brand">Ordering for this item opens soon. Ask us about it below.</p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link href={`/contact?${new URLSearchParams({ message: `Hi, I have a question about the Delta ${product.title}: ` })}`}>
              <MessageCircle /> Ask us about sizing
            </Link>
          </Button>
          {product.description && (
            <div className="space-y-3 border-t border-carbon/10 pt-6">
              <h2 className="font-display text-2xl font-bold uppercase">Description</h2>
              <p className="whitespace-pre-line leading-relaxed text-carbon/80">{product.description}</p>
            </div>
          )}
          {product.specs.length > 0 && (
            <div className="space-y-3 border-t border-carbon/10 pt-6">
              <h2 className="font-display text-2xl font-bold uppercase">Details</h2>
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
