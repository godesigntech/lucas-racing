import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AeroKitTable } from "@/components/admin/builder/fittings-table"
import { MigrationNotice } from "@/components/admin/builder/migration-notice"
import { Skeleton } from "@/components/ui/skeleton"
import { listAdminHelmetModels } from "@/lib/data/admin"
import { getAdminBuilderCatalog } from "@/lib/data/builder-admin"

export const metadata = { title: "Aero kits" }

export default function AdminBuilderAeroPage() {
  return (
    <>
      <AdminPageHeader
        title="Step 2 · Aero kits"
        description="The standard aero for each helmet and the spoilers customers can upgrade to. Leave a price blank until it's confirmed: the kit still previews in 3D, but checkout won't take the order."
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        <AeroKits />
      </Suspense>
    </>
  )
}

async function AeroKits() {
  const [{ ready, aeroKits }, models] = await Promise.all([getAdminBuilderCatalog(), listAdminHelmetModels()])
  if (!ready) return <MigrationNotice area="Aero kits" />
  return <AeroKitTable kits={aeroKits} models={models} />
}
