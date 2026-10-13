import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { getProductCategories, getProducts } from "@/lib/data/products"

export async function Categories() {
  const [categories, products] = await Promise.all([getProductCategories(), getProducts()])

  return (
    <section className="py-20 sm:py-24">
      <Container className="space-y-12">
        <SectionHeading
          eyebrow="Shop by style"
          title="Pick a direction"
          description="Clean lines, a hydro-dip film, a chrome base or a design that starts from nothing."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const example = products.find((product) => product.category === category.id)
            const count = products.filter((product) => product.category === category.id).length
            return (
              <li key={category.id}>
                <Link
                  href={`/products?category=${category.id}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-carbon p-6 text-paper transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <span className="eyebrow text-lime">
                      {count} {count === 1 ? "design" : "designs"}
                    </span>
                    <ArrowUpRight
                      className="size-5 text-paper/60 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime"
                      aria-hidden
                    />
                  </div>
                  {example && (
                    <div className="my-4 transition-transform duration-500 group-hover:scale-105">
                      <HelmetArt look={example.look} />
                    </div>
                  )}
                  <h3 className="mt-auto font-display text-3xl font-bold uppercase">{category.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/65">{category.description}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
