"use client"

import Image from "next/image"
import Link from "next/link"
import { AlertTriangle, Package, Trash2 } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { StockBadge } from "@/components/shop/stock-badge"
import { basket } from "@/lib/basket/basket-store"
import type { ResolvedBasketLine, ResolvedHelmetLine, ResolvedProductLine } from "@/lib/basket/resolve-basket"
import { formatMoney } from "@/lib/format"
import { isExternalImage } from "@/lib/shop/images"
import { productHref } from "@/lib/shop/part-finish"

import { QuantityStepper } from "./quantity-stepper"

function RemoveButton({ id }: { id: string }) {
  return (
    <button
      type="button"
      onClick={() => basket.remove(id)}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" aria-hidden /> Remove
    </button>
  )
}

export function BasketLine({ line }: { line: ResolvedBasketLine }) {
  if (!line.available) {
    return (
      <li className="flex items-center gap-4 rounded-3xl border border-dashed border-destructive/40 bg-card p-5">
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{line.item.name}</p>
          <p className="text-sm text-muted-foreground">{line.reason}</p>
        </div>
        <button
          type="button"
          onClick={() => basket.remove(line.item.id)}
          className="rounded-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          Remove
        </button>
      </li>
    )
  }
  return line.kind === "product" ? <ProductLine line={line} /> : <HelmetLine line={line} />
}

function HelmetLine({ line }: { line: ResolvedHelmetLine }) {
  const { item } = line
  const details = line.summary.filter((row) => row.key !== "model")

  return (
    <li className="grid gap-5 rounded-3xl border border-carbon/10 bg-card p-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:p-6">
      <Link
        href={`/helmet-builder?template=${line.product.slug}`}
        className="grid aspect-[4/3] place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e8e7e0_75%)] p-3"
        aria-label={`View ${line.product.name}`}
      >
        <HelmetArt look={line.look} />
      </Link>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-bold uppercase leading-none">{line.product.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{line.summary.find((row) => row.key === "model")?.value}</p>
          </div>
          <p className="font-display text-2xl font-bold">{formatMoney(line.lineTotal)}</p>
        </div>

        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {details.map((row) => (
            <div key={row.key} className="flex justify-between gap-3 border-b border-carbon/5 py-1">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <QuantityStepper
              value={item.quantity}
              onChange={(quantity) => basket.setQuantity(item.id, quantity)}
              label={`Quantity of ${line.product.name}`}
            />
            {item.quantity > 1 && <span className="text-xs text-muted-foreground">{formatMoney(line.unitPrice)} each</span>}
          </div>
          <RemoveButton id={item.id} />
        </div>
      </div>
    </li>
  )
}

function ProductLine({ line }: { line: ResolvedProductLine }) {
  const { item, product, variant } = line
  const image = product.images[0]
  const href = productHref(product)

  return (
    <li className="grid gap-5 rounded-3xl border border-carbon/10 bg-card p-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:p-6">
      <Link href={href} className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-carbon/5" aria-label={`View ${product.title}`}>
        {image ? (
          <Image src={image} alt="" fill sizes="160px" unoptimized={isExternalImage(image)} className="object-contain p-2" />
        ) : (
          <Package className="size-8 text-muted-foreground" aria-hidden />
        )}
      </Link>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-bold uppercase leading-none">
              <Link href={href} className="underline-offset-4 hover:underline">
                {product.title}
              </Link>
            </h3>
            {line.variantLabel && <p className="mt-1 text-sm text-muted-foreground">{line.variantLabel}</p>}
            {line.finishSummary.map((row) => (
              <p key={row.key} className="mt-0.5 text-sm text-muted-foreground">
                <span className="font-medium text-carbon">{row.label}:</span> {row.value}
              </p>
            ))}
            {variant.sku && <p className="mt-0.5 font-mono text-xs text-muted-foreground">Part no. {variant.sku}</p>}
          </div>
          <p className="font-display text-2xl font-bold">{formatMoney(line.lineTotal)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StockBadge status={line.status} />
          {line.note && <p className="text-xs font-medium text-destructive">{line.note}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <QuantityStepper
              value={line.quantity}
              max={line.maxQuantity}
              onChange={(quantity) => basket.setQuantity(item.id, quantity)}
              label={`Quantity of ${product.title}`}
            />
            {line.quantity > 1 && <span className="text-xs text-muted-foreground">{formatMoney(line.unitPrice)} each</span>}
          </div>
          <RemoveButton id={item.id} />
        </div>
      </div>
    </li>
  )
}
