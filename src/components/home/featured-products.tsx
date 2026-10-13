import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { ProductGrid } from "@/components/products/product-grid"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { getFeaturedProducts } from "@/lib/data/products"

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(4)

  return (
    <section className="py-20 sm:py-24">
      <Container className="space-y-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Featured designs"
            title="Start from a design the grid already knows"
            description="Each layout is a starting point. Every section can be recoloured, dipped in film or left clean."
          />
          <Button asChild variant="outline" className="self-start md:self-auto">
            <Link href="/products">
              View all designs <ArrowRight />
            </Link>
          </Button>
        </div>
        <ProductGrid products={products} columns={4} />
      </Container>
    </section>
  )
}
