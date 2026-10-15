"use client"

import Link from "next/link"
import { ArrowRight, Lock, ShoppingBag } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useBasket, useBasketLoaded } from "@/lib/basket/basket-store"
import { basketSubtotal, resolveBasketLine } from "@/lib/basket/resolve-basket"
import { formatMoney } from "@/lib/format"
import type { PriceBook } from "@/types/catalog"
import type { CatalogProduct } from "@/types/product"

import { BasketLine } from "./basket-line"

interface BasketViewProps {
  products: CatalogProduct[]
  priceBook: PriceBook
}

export function BasketView({ products, priceBook }: BasketViewProps) {
  const items = useBasket()
  const loaded = useBasketLoaded()
  const lines = items.map((item) => resolveBasketLine(item, products, priceBook))
  const subtotal = basketSubtotal(lines)
  const orderable = lines.some((line) => line.available)

  if (!loaded) return <Skeleton className="h-80 rounded-3xl" aria-label="Loading your basket" />

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your basket is empty"
        description="Pick a helmet design, make it yours in the configurator, then add it here."
        action={
          <Button asChild>
            <Link href="/products">
              Browse helmet designs <ArrowRight />
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-10">
      <ul className="space-y-4" aria-label="Basket items">
        {lines.map((line) => (
          <BasketLine key={line.item.id} line={line} />
        ))}
      </ul>

      <aside className="space-y-5 self-start rounded-3xl bg-carbon p-6 text-paper lg:sticky lg:top-32">
        <h2 className="font-display text-3xl font-bold uppercase">Summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-paper/60">Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-paper/60">Delivery</dt>
            <dd className="text-paper/60">Chosen at checkout</dd>
          </div>
        </dl>
        <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
          <span className="text-sm text-paper/60">Estimated total</span>
          <span className="font-display text-4xl font-bold">{formatMoney(subtotal)}</span>
        </div>
        {orderable ? (
          <Button asChild size="lg" className="w-full">
            <Link href="/checkout">
              Go to checkout <ArrowRight />
            </Link>
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled>
            Go to checkout
          </Button>
        )}
        <p className="flex items-start gap-2 text-xs text-paper/55">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          You approve a digital proof before anything is painted. Nothing is charged today.
        </p>
        <Link href="/products" className="block text-center text-sm text-paper/70 underline-offset-4 hover:underline">
          Continue shopping
        </Link>
      </aside>
    </div>
  )
}
