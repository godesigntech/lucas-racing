import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AeroKitTable, VisorTable } from "@/components/admin/builder/fittings-table"
import { MigrationNotice } from "@/components/admin/builder/migration-notice"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminHelmetModels } from "@/lib/data/admin"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"

export const metadata = { title: "Aero and visors" }

export default function AdminFittingsPage() {
  return (
    <>
      <AdminPageHeader
        title="Aero and visors"
        description="What customers can add at steps 2 and 12 of the builder. Leave a price blank until the client confirms it: the option still appears and previews in 3D, but checkout won't take the order."
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        <Fittings />
      </Suspense>
    </>
  )
}

async function Fittings() {
  const [{ ready, aeroKits, visors }, models] = await Promise.all([getAdminBuilderCatalog(), listAdminHelmetModels()])
  if (!ready) return <MigrationNotice area="Aero kits and visors" />

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <AeroKitTable kits={aeroKits} models={models} />
      <VisorTable visors={visors} models={models} />
    </div>
  )
}
