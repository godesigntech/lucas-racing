import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderOptionGroups } from "@/components/admin/builder/builder-option-groups"
import { VisorTable } from "@/components/admin/builder/fittings-table"
import { MigrationNotice } from "@/components/admin/builder/migration-notice"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminHelmetModels } from "@/lib/data/admin"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"

export const metadata = { title: "Visors & visor strip" }

export default function AdminBuilderVisorsPage() {
  return (
    <>
      <AdminPageHeader
        title="Steps 12–13 · Visors & visor strip"
        description="The visors offered for each helmet and the printed strip across the top. Leave a visor's price blank until it's confirmed: it still previews, but checkout won't take the order."
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        <Visors />
      </Suspense>
    </>
  )
}

async function Visors() {
  const [{ ready, visors }, models] = await Promise.all([getAdminBuilderCatalog(), listAdminHelmetModels()])

  return (
    <div className="space-y-6">
      {ready ? <VisorTable visors={visors} models={models} /> : <MigrationNotice area="Visors" />}
      <BuilderOptionGroups
        groups={[{ key: "visor_strip", title: "Visor strip", description: "Step 13: the printed band across the top of the visor." }]}
      />
    </div>
  )
}
