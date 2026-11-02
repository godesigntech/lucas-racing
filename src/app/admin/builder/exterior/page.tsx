import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderOptionGroups } from "@/components/admin/builder/builder-option-groups"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Exterior parts" }

export default function AdminBuilderExteriorPage() {
  return (
    <>
      <AdminPageHeader
        title="Step 11 · Exterior parts"
        description="The rubber trim colours customers can pick. Spoilers are chosen in step 2 (Aero kits)."
      />
      <Suspense fallback={<Skeleton className="h-[20rem] rounded-2xl" />}>
        <BuilderOptionGroups groups={[{ key: "trim", title: "Rubber trim", description: "Eye-port and base rubber colours." }]} />
      </Suspense>
    </>
  )
}
