import { Suspense } from "react"
import type { Metadata } from "next"

import { Container } from "@/components/layout/container"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { ComingSoon } from "@/components/shared/coming-soon"
import { Skeleton } from "@/components/ui/skeleton"
import { VisorStickerShop } from "@/components/visor-stickers/visor-sticker-shop"
import { images } from "@/constants/images"
import { getPriceBook } from "@/lib/data/products"
import { getShopProductBySlug } from "@/lib/data/shop"
import { VISOR_STICKER_SLUG } from "@/lib/shop/part-finish"

export const metadata: Metadata = {
  title: "Visor stickers",
  description: "The Lucas Racing holographic visor sticker, or one of our designs in your colours with your name or number.",
}

export default function VisorStickersPage() {
  return (
    <section className="py-10 sm:py-14">
      <Container className="space-y-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Customisation", href: "/customisation" }, { label: "Visor stickers" }]} />
        <div className="max-w-2xl space-y-3">
          <p className="eyebrow text-brand-ink">Customisation</p>
          <h1 className="display text-5xl sm:text-6xl">Visor stickers</h1>
          <p className="text-muted-foreground">
            Our Lucas Racing holographic sticker, or one of our designs in your own colours with your name or number. £15 each, or £30 for a
            design in holographic.
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-[36rem] rounded-3xl" />}>
          <Shop />
        </Suspense>
      </Container>
    </section>
  )
}

async function Shop() {
  const [product, priceBook] = await Promise.all([getShopProductBySlug(VISOR_STICKER_SLUG), getPriceBook()])
  // Until the product is set up (migration 20261117006100), point people at a quote instead.
  if (!product || product.storeId !== "hydrokarts-parts" || product.variants.length === 0) {
    return (
      <ComingSoon
        eyebrow="Customisation"
        title="Visor stickers"
        description="Visor stickers on their own are coming soon. Ask us and we'll make yours."
        image={images.connor}
        points={["The Lucas Racing holographic sticker", "Our designs in your colours", "Your name or number on it"]}
        enquiryMessage="Hi, I'd like a visor sticker on its own: "
      />
    )
  }
  return <VisorStickerShop product={product} priceBook={priceBook} />
}
