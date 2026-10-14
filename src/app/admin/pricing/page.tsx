import { Suspense } from "react"
import Link from "next/link"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { HelmetModelForm } from "@/components/admin/helmet-model-form"
import { OptionGroupForm } from "@/components/admin/option-group-form"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminHelmetModels, listAdminOptions } from "@/lib/data/admin"
import type { OptionGroupKey } from "@/types/catalog"

export const metadata = { title: "Pricing" }

const groups: { key: OptionGroupKey; title: string; description: string }[] = [
  { key: "route", title: "Helmet supply", description: "Fee for each route. The new helmet price is set per helmet above." },
  { key: "finish", title: "Base finish", description: "Gloss, matte and chrome surcharges." },
  { key: "base", title: "Base colours", description: "Colours offered for the shell." },
  { key: "trim", title: "Rubber trim", description: "Eye-port and base rubber colours." },
  { key: "spoiler", title: "Rear spoiler", description: "Spoiler surcharge." },
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
  const [models, options] = await Promise.all([listAdminHelmetModels(), listAdminOptions()])

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
