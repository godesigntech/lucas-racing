"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { basket } from "@/lib/basket/basket-store"
import type { ShopListingItem } from "@/lib/data/shop-listing"

/** Adds a single-option product straight from the grid. Products with sizes open their page instead. */
export function QuickAddButton({ item }: { item: ShopListingItem }) {
  if (!item.singleVariantId || !item.inStock) return null
  const variantId = item.singleVariantId

  return (
    <Button
      size="icon-sm"
      className="relative z-10 shrink-0"
      aria-label={`Add ${item.title} to basket`}
      onClick={() => {
        basket.addProduct(
          { variantId, productSlug: item.slug, storeId: item.storeId, name: item.title, variantLabel: "", imageUrl: item.imageUrl },
          1,
        )
        toast.success(
          <span>
            {item.title} added to your basket.{" "}
            <Link href="/basket" className="font-semibold underline underline-offset-2">
              View basket
            </Link>
          </span>,
        )
      }}
    >
      <Plus />
    </Button>
  )
}
