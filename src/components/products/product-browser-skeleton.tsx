import { Skeleton } from "@/components/ui/skeleton"

export function ProductBrowserSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading designs">
      <Skeleton className="h-[4.5rem] rounded-3xl" />
      <Skeleton className="h-5 w-48" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="space-y-4 rounded-3xl border border-carbon/10 bg-card p-4">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
