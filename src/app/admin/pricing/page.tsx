import { Suspense } from "react"
import Link from "next/link"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { HelmetSizesForm } from "@/components/admin/builder/helmet-sizes-form"
import { HelmetModelForm } from "@/components/admin/helmet-model-form"
import { OptionGroupForm } from "@/components/admin/option-group-form"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminHelmetModels, listAdminOptions } from "@/lib/data/admin"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"
import type { OptionGroupKey } from "@/types/catalog"

export const metadata = { title: "Pricing" }

const groups: { key: OptionGroupKey; title: string; description: string }[] = [
  { key: "finish", title: "Finish", description: "Gloss, satin and matte lacquer surcharges." },
  { key: "material", title: "Metallic and chrome", description: "Paint finishes customers can set on any area of a design." },
  { key: "base", title: "Paint colours", description: "Colours customers can use on every part of a design." },
  { key: "trim", title: "Rubber trim", description: "Eye-port and base rubber colours." },
  { key: "spoiler", title: "Rear spoiler", description: "Used when a design has no aero kit set up." },
  { key: "route", title: "Who supplies the helmet", description: "A new shell from us, or the customer sends their own." },
  { key: "visor_strip", title: "Visor strip", description: "The printed band across the top of the visor." },
  { key: "personalisation", title: "Personalisation", description: "Names, numbers, initials, flags and custom text." },
]

export default function AdminPricingPage() {
  return (
    <>
      <AdminPageHeader
        title="Pricing"
        description={
          <>
            Prices for helmets and configurator options. A helmet&apos;s price is its design&apos;s starting price plus
            these extras. Set design prices in{" "}
            <Link href="/admin/products" className="font-medium text-carbon underline underline-offset-4">
              Products
            </Link>{" "}
            and film prices in{" "}
            <Link href="/admin/films" className="font-medium text-carbon underline underline-offset-4">
              Films
            </Link>
            .
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <PricingEditor />
      </Suspense>
    </>
  )
}

async function PricingEditor() {
  const [models, options, builder] = await Promise.all([
    listAdminHelmetModels(),
    listAdminOptions(),
    getAdminBuilderCatalog(),
  ])

  return (
    <div className="space-y-10">
      <section aria-labelledby="helmets-heading" className="space-y-4">
        <h2 id="helmets-heading" className="font-display text-2xl font-bold uppercase">
          Helmets
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {models.map((model) => (
            <HelmetModelForm key={model.id} model={model} />
          ))}
        </div>
      </section>

      {builder.ready && (
        <section aria-labelledby="sizes-heading" className="space-y-4">
          <div>
            <h2 id="sizes-heading" className="font-display text-2xl font-bold uppercase">
              Sizes
            </h2>
            <p className="text-sm text-muted-foreground">
              What each helmet is offered in, and any surcharge on top of its price.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {models.map((model) => (
              <HelmetSizesForm
                key={model.id}
                model={model}
                sizes={builder.sizes.filter((size) => size.modelId === model.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="options-heading" className="space-y-4">
        <h2 id="options-heading" className="font-display text-2xl font-bold uppercase">
          Configurator options
        </h2>
        <div className="grid gap-6 xl:grid-cols-2">
          {groups.map((group) => (
            <OptionGroupForm
              key={group.key}
              group={group.key}
              title={group.title}
              description={group.description}
              options={options.filter((option) => option.group === group.key)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
