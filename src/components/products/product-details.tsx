import { CircleCheck } from "lucide-react"

import type { Product } from "@/types/product"

export function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="features-heading" className="rounded-3xl border border-carbon/10 bg-card p-6 sm:p-8">
        <h2 id="features-heading" className="font-display text-3xl font-bold uppercase">
          Key features
        </h2>
        <ul className="mt-6 space-y-4">
          {product.features.map((feature) => (
            <li key={feature} className="flex gap-3">
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-lime-ink" aria-hidden />
              <span className="leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="specs-heading" className="rounded-3xl border border-carbon/10 bg-card p-6 sm:p-8">
        <h2 id="specs-heading" className="font-display text-3xl font-bold uppercase">
          Specification
        </h2>
        <dl className="mt-6 divide-y divide-carbon/10">
          {product.specs.map((spec) => (
            <div key={spec.label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground sm:pt-0.5">{spec.label}</dt>
              <dd className="text-sm">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
