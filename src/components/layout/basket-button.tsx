"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"

import { useBasketCount } from "@/lib/basket/basket-store"
import { cn } from "@/lib/utils"

export function BasketButton({ className }: { className?: string }) {
  const count = useBasketCount()

  return (
    <Link
      href="/basket"
      aria-label={count ? `Basket, ${count} ${count === 1 ? "item" : "items"}` : "Basket, empty"}
      className={cn(
        "relative grid size-10 place-items-center rounded-full border border-carbon/15 text-carbon transition-colors hover:border-carbon/40 hover:bg-foreground/5",
        className,
      )}
    >
      <ShoppingBag className="size-[1.1rem]" aria-hidden />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-lime px-1 text-[0.68rem] font-bold leading-5 text-carbon ring-2 ring-paper">
          {count}
        </span>
      )}
    </Link>
  )
}
