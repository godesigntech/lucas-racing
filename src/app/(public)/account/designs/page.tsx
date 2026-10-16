import { Suspense } from "react"
import Link from "next/link"
import { Bookmark, PenLine } from "lucide-react"

import { AccountPageHeader } from "@/components/account/account-page-header"
import { DeleteDesignButton } from "@/components/account/delete-design-button"
import { HelmetArt } from "@/components/helmet/helmet-art"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { configurationToLook, normaliseConfiguration } from "@/lib/configurator/helmet-configuration"
import { getMyDesigns } from "@/lib/data/account"
import { getPriceBook, getProducts } from "@/lib/data/products"
import { formatDate } from "@/lib/format"

export const metadata = { title: "Saved designs" }

export default function SavedDesignsPage() {
  return (
    <>
      <AccountPageHeader title="Saved designs" description="Helmets you've saved from the builder. Open one to carry on or order it." />
      <Suspense fallback={<Skeleton className="h-80 rounded-3xl" />}>
        <Designs />
      </Suspense>
    </>
  )
}

async function Designs() {
  const [designs, products, priceBook] = await Promise.all([getMyDesigns(), getProducts(), getPriceBook()])

  if (designs.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="No saved designs yet"
        description="Use “Save design” in the helmet builder and your designs will appear here."
        action={
          <Button asChild>
            <Link href="/customisation/helmets">Start designing</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {designs.map((design) => {
        const product = products.find((item) => item.slug === design.productSlug)
        const look = product ? configurationToLook(product, normaliseConfiguration(design.config, product, priceBook), priceBook) : null
        return (
          <li key={design.id} className="flex flex-col overflow-hidden rounded-3xl border border-carbon/10 bg-card">
            <div className="grid aspect-[4/3] place-items-center bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_70%)] p-6">
              {look ? <HelmetArt look={look} title={design.name} className="max-h-full" /> : <p className="text-sm text-muted-foreground">Design no longer available</p>}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <p className="font-display text-2xl font-bold uppercase leading-tight">{design.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product?.name ?? design.productSlug} · saved {formatDate(design.updatedAt)}
                </p>
              </div>
              <div className="mt-auto flex items-center gap-2">
                {product && (
                  <Button asChild size="sm">
                    <Link href={`/helmet-builder?design=${design.id}`}>
                      <PenLine /> Open in builder
                    </Link>
                  </Button>
                )}
                <DeleteDesignButton id={design.id} name={design.name} />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
