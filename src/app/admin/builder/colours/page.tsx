import { Suspense } from "react"
import Link from "next/link"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderOptionGroups } from "@/components/admin/builder/builder-option-groups"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = { title: "Colours & paint" }

export default function AdminBuilderColoursPage() {
  return (
    <>
      <AdminPageHeader
        title="Steps 4–7 · Colours & paint"
        description={
          <>
            The colours customers can use on any part of a design and on the pinstripes, and the price of metallic and
            chrome paint. Hydro-dip films (step 6) are in{" "}
            <Link href="/admin/builder/films" className="font-medium text-carbon underline underline-offset-4">
              Films
            </Link>
            .
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
        <BuilderOptionGroups
          groups={[
            { key: "base", title: "Paint colours", description: "Steps 4 and 7: colours for every part of a design and for pinstripes." },
            { key: "material", title: "Metallic and chrome", description: "Step 5: paint finishes customers can set on any area of a design." },
          ]}
        />
      </Suspense>
    </>
  )
}
