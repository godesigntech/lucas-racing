import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { MigrationNotice } from "@/components/admin/builder/migration-notice"
import { TemplateCard } from "@/components/admin/builder/template-card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminProduct, listAdminHelmetModels } from "@/lib/data/admin"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"

export const metadata = { title: "3D artwork" }

export default function AdminTemplateArtworkPage({ params }: PageProps<"/admin/builder/templates/[slug]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
      {params.then(({ slug }) => (
        <TemplateArtwork slug={slug} />
      ))}
    </Suspense>
  )
}

async function TemplateArtwork({ slug }: { slug: string }) {
  const [product, { ready, templates }, models] = await Promise.all([
    getAdminProduct(slug),
    getAdminBuilderCatalog(),
    listAdminHelmetModels(),
  ])
  const artwork = templates.filter((template) => template.productSlug === slug)

  return (
    <>
      <AdminPageHeader
        back={{ href: "/admin/builder/templates", label: "Templates" }}
        title={`${product.name} · 3D artwork`}
        description="One set of artwork per helmet, because the masks are cut against that helmet's shape. Set the status once the 3D artist delivers, and the areas customers can colour."
      />
      {!ready ? (
        <MigrationNotice area="Design templates" />
      ) : artwork.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-carbon/20 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          No 3D artwork for this template yet.
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {artwork.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              modelName={models.find((model) => model.id === template.modelId)?.name ?? template.modelId}
            />
          ))}
        </div>
      )}
    </>
  )
}
