import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Container } from "@/components/layout/container"
import { HelmetConfigurator } from "@/components/products/configurator/helmet-configurator"
import { ProductDetails } from "@/components/products/product-details"
import { ProductGallery } from "@/components/products/product-gallery"
import { ProductGrid } from "@/components/products/product-grid"
import { ProductSummary } from "@/components/products/product-summary"
import { Breadcrumbs } from "@/components/shared/breadcrumbs"
import { SectionHeading } from "@/components/shared/section-heading"
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/data/products"

export async function generateStaticParams() {
  const products = await getProducts()
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "Design not found" }

  return {
    title: `${product.name} helmet design`,
    description: `${product.tagline} ${product.description}`,
    openGraph: {
      title: `${product.name} custom helmet`,
      description: product.tagline,
    },
  }
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)

  return (
    <>
      <section className="pb-16 pt-8 sm:pb-20">
        <Container className="space-y-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: product.name },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery look={product.look} name={product.name} />
            <ProductSummary product={product} />
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-20">
        <Container>
          <ProductDetails product={product} />
        </Container>
      </section>

      <section id="configure" className="border-y border-carbon/10 bg-smoke/60 py-16 sm:py-20">
        <Container className="space-y-10">
          <SectionHeading
            eyebrow="Configure"
            title={`Make ${product.name} yours`}
            description="Choose your shell, finish, colours, film and trims. The preview updates as you go, and you can send the build to the workshop as an enquiry."
          />
          <HelmetConfigurator product={product} />
        </Container>
      </section>

      {related.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container className="space-y-10">
            <SectionHeading eyebrow="Keep looking" title="Related designs" />
            <ProductGrid products={related} />
          </Container>
        </section>
      )}
    </>
  )
}
