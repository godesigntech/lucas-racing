import { Container } from "@/components/layout/container"
import { ProductBrowserSkeleton } from "@/components/products/product-browser-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductsLoading() {
  return (
    <>
      <div className="bg-carbon py-20">
        <Container className="space-y-4">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-16 w-2/3 max-w-lg bg-white/10" />
        </Container>
      </div>
      <Container className="py-12 sm:py-16">
        <ProductBrowserSkeleton />
      </Container>
    </>
  )
}
