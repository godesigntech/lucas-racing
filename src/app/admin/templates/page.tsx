import { Suspense } from "react"
import Link from "next/link"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { MigrationNotice } from "@/components/admin/builder/migration-notice"
import { TemplateCard } from "@/components/admin/builder/template-card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"
import { listAdminHelmetModels } from "@/lib/data/admin"

export const metadata = { title: "Design templates" }

export default function AdminTemplatesPage() {
  return (
    <>
      <AdminPageHeader
        title="Design templates"
        description={
          <>
            The artwork behind each design, and the areas customers can colour in. A design has one template per
            helmet, because the masks are cut against that helmet&apos;s shape. Names and prices live in{" "}
            <Link href="/admin/products" className="font-medium text-carbon underline underline-offset-4">
              Helmet designs
            </Link>
            .
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-2xl" />}>
        <TemplateList />
      </Suspense>
    </>
  )
}

async function TemplateList() {
  const [{ ready, templates }, models] = await Promise.all([getAdminBuilderCatalog(), listAdminHelmetModels()])
  if (!ready) return <MigrationNotice area="Design templates" />

  if (templates.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-carbon/20 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        No templates yet. One is created for every design and helmet when the migration runs.
      </p>
    )
  }

  // Grouped by design, so a design's Arai and Bell artwork sit together.
  const bySlug = new Map<string, typeof templates>()
  for (const template of templates) {
    bySlug.set(template.productSlug, [...(bySlug.get(template.productSlug) ?? []), template])
  }

  return (
    <div className="space-y-8">
      {[...bySlug.entries()].map(([slug, group]) => (
        <section key={slug} className="space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase">{slug}</h2>
          <div className="grid gap-6 xl:grid-cols-2">
            {group.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                modelName={models.find((model) => model.id === template.modelId)?.name ?? template.modelId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
