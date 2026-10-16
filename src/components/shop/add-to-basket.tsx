"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { toast } from "react-toastify"

import { QuantityStepper } from "@/components/basket/quantity-stepper"
import { Button } from "@/components/ui/button"
import { basket } from "@/lib/basket/basket-store"
import { formatMoney } from "@/lib/format"
import { defaultFinish, isCustomisable, priceFinish, type PartFinish } from "@/lib/shop/part-finish"
import { canBuy, maxQuantity, stockStatus, variantLabel } from "@/lib/shop/stock"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { ShopProduct, ShopVariant } from "@/types/shop"

import { PartFinishPicker } from "./part-finish-picker"
import { StockBadge } from "./stock-badge"

/** Values offered for one option name, in the order the variants are listed. */
function optionValues(variants: ShopVariant[], name: string): string[] {
  return [...new Set(variants.map((variant) => variant.options[name]).filter(Boolean))]
}

/**
 * Option picker (size, colour…), live price and stock, quantity and Add to basket.
 * Customisable parts also pick a finish, priced from the helmet price list (`priceBook`).
 */
export function AddToBasket({ product, priceBook }: { product: ShopProduct; priceBook?: PriceBook }) {
  const variants = product.variants
  const firstBuyable = variants.find((variant) => canBuy(variant)) ?? variants[0]
  const [selected, setSelected] = useState<Record<string, string>>(firstBuyable?.options ?? {})
  const [quantity, setQuantity] = useState(1)
  const customisable = Boolean(priceBook) && isCustomisable(product)
  const [finish, setFinish] = useState<PartFinish | null>(() => (customisable && priceBook ? defaultFinish(product, priceBook) : null))
  const finishPrice = customisable && priceBook && finish ? priceFinish(product, finish, priceBook) : null

  const variant =
    variants.find((candidate) => product.optionNames.every((name) => candidate.options[name] === selected[name])) ??
    (product.optionNames.length === 0 ? variants[0] : undefined)

  if (variants.length === 0) {
    return <p className="rounded-2xl bg-carbon/5 p-4 text-sm text-muted-foreground">This product isn&apos;t available to order right now.</p>
  }

  const status = variant ? stockStatus(variant) : null
  const max = variant ? maxQuantity(variant) : 0
  const buyable = Boolean(variant) && max > 0 && (!customisable || Boolean(finishPrice))
  const price = variant ? variant.price + (finishPrice?.extra ?? 0) : null

  function choose(name: string, value: string) {
    setSelected((current) => ({ ...current, [name]: value }))
    setQuantity(1)
  }

  function add() {
    if (!variant || !buyable) return
    basket.addProduct(
      {
        variantId: variant.id,
        productSlug: product.slug,
        storeId: product.storeId,
        name: product.title,
        variantLabel: variantLabel(variant),
        imageUrl: product.images[0] ?? null,
        ...(customisable && finish ? { finish } : {}),
      },
      quantity,
      max,
    )
    toast.success(
      <span>
        {product.title} added to your basket.{" "}
        <Link href="/basket" className="font-semibold underline underline-offset-2">
          View basket
        </Link>
      </span>,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="font-display text-5xl font-bold">{price !== null ? formatMoney(price) : "Choose an option"}</p>
        {!customisable && variant?.compareAtPrice !== null && variant?.compareAtPrice !== undefined && variant.compareAtPrice > variant.price && (
          <p className="text-lg text-muted-foreground line-through">{formatMoney(variant.compareAtPrice)}</p>
        )}
      </div>

      {product.optionNames.map((name) => (
        <fieldset key={name} className="space-y-2">
          <legend className="text-sm font-semibold">
            {name}
            {selected[name] && <span className="font-normal text-muted-foreground">: {selected[name]}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {optionValues(variants, name).map((value) => {
              // Is there a buyable variant with this value and the other current choices?
              const match = variants.find(
                (candidate) =>
                  candidate.options[name] === value &&
                  product.optionNames.every((other) => other === name || candidate.options[other] === selected[other]),
              )
              const soldOut = !match || !canBuy(match)
              return (
                <label key={value}>
                  <input
                    type="radio"
                    name={`option-${name}`}
                    value={value}
                    checked={selected[name] === value}
                    onChange={() => choose(name, value)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "inline-flex h-10 min-w-12 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                      selected[name] === value ? "border-carbon bg-carbon text-paper" : "border-carbon/20 hover:border-carbon/50",
                      soldOut && "text-muted-foreground line-through decoration-1",
                    )}
                  >
                    {value}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}

      {customisable && priceBook && finish && (
        <PartFinishPicker allowed={product.customFinishes} priceBook={priceBook} value={finish} onChange={setFinish} />
      )}
      {customisable && variant && finishPrice && (
        <p className="text-sm text-muted-foreground">
          Part {formatMoney(variant.price)} + customisation {formatMoney(finishPrice.extra)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {status && <StockBadge status={status} />}
        {variant?.sku && <span className="font-mono text-xs text-muted-foreground">Part no. {variant.sku}</span>}
        {status === "low_stock" && variant && <span className="text-xs text-muted-foreground">Only {variant.stockQuantity} left</span>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <QuantityStepper value={Math.min(quantity, Math.max(1, max))} max={Math.max(1, max)} onChange={setQuantity} label="Quantity" />
        <Button size="lg" className="sm:flex-1" onClick={add} disabled={!buyable}>
          <ShoppingBag aria-hidden />
          {!variant ? "Choose an option" : buyable ? "Add to basket" : max > 0 ? "Choose a finish" : "Out of stock"}
        </Button>
      </div>
      {max === 0 && variant && (
        <p className="text-sm text-muted-foreground">
          Out of stock right now.{" "}
          <Link
            href={`/contact?${new URLSearchParams({ message: `Hi, when will ${product.title}${variantLabel(variant) ? ` (${variantLabel(variant)})` : ""} be back in stock?` })}`}
            className="font-semibold underline-offset-4 hover:underline"
          >
            Ask us when it&apos;s back
          </Link>
        </p>
      )}
    </div>
  )
}
