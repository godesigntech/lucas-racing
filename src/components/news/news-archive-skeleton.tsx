import { Container } from "@/components/layout/container"
import { Skeleton } from "@/components/ui/skeleton"

export function NewsArchiveSkeleton() {
  return (
    <Container className="space-y-8 py-10 sm:py-14" aria-busy="true" aria-label="Loading the news">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/5] rounded-3xl" />
        ))}
      </div>
    </Container>
  )
}
