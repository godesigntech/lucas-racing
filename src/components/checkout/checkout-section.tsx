interface CheckoutSectionProps {
  step: number
  title: string
  description?: string
  children: React.ReactNode
}

/** Numbered step card used on the checkout page. */
export function CheckoutSection({ step, title, description, children }: CheckoutSectionProps) {
  return (
    <section className="rounded-3xl border border-carbon/10 bg-card p-5 sm:p-7" aria-labelledby={`checkout-step-${step}`}>
      <div className="mb-6 flex items-start gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-carbon font-display text-lg font-bold text-brand">
          {step}
        </span>
        <div>
          <h2 id={`checkout-step-${step}`} className="font-display text-2xl font-bold uppercase leading-tight">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
