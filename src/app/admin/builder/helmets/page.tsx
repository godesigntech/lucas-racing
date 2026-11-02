import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderOptionGroups } from "@/components/admin/builder/builder-option-groups"
import { HelmetSizesForm } from "@/components/admin/builder/helmet-sizes-form"
import { HelmetModelForm } from "@/components/admin/helmet-model-form"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminHelmetModels } from "@/lib/data/admin"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"

export const metadata = { title: "Helmets & sizes" }

export default function AdminBuilderHelmetsPage() {
  return (
    <>
      <AdminPageHeader
        title="Step 1 · Helmets & sizes"
        description="The helmets customers can choose, what a new shell costs, the sizes each comes in, and whether customers can send their own helmet instead."
      />
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <Helmets />
      </Suspense>
    </>
  )
}

async function Helmets() {
  const [models, builder] = await Promise.all([listAdminHelmetModels(), getAdminBuilderCatalog()])

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
            <p className="text-sm text-muted-foreground">What each helmet is offered in, and any surcharge on top of its price.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {models.map((model) => (
              <HelmetSizesForm key={model.id} model={model} sizes={builder.sizes.filter((size) => size.modelId === model.id)} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="route-heading" className="space-y-4">
        <h2 id="route-heading" className="font-display text-2xl font-bold uppercase">
          Own helmet
        </h2>
        <BuilderOptionGroups
          groups={[
            {
              key: "route",
              title: "Who supplies the helmet",
              description: "A new shell from us, or the customer sends their own. Own helmets are quoted from the photos they send.",
            },
          ]}
        />
      </section>
    </div>
  )
}
