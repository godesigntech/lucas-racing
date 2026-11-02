import { Suspense } from "react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderOptionGroups } from "@/components/admin/builder/builder-option-groups"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Lacquer" }

export default function AdminBuilderLacquerPage() {
  return (
    <>
      <AdminPageHeader
        title="Step 8 · Lacquer"
        description="The overall finish on the helmet. Designs with metallic or chrome paint are always finished in gloss."
      />
      <Suspense fallback={<Skeleton className="h-[20rem] rounded-2xl" />}>
        <BuilderOptionGroups
          groups={[{ key: "finish", title: "Finish", description: "The client's journey offers gloss and matt; switch satin off here." }]}
        />
      </Suspense>
    </>
  )
}
