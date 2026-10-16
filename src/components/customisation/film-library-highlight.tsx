import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Container } from "@/components/layout/container"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import type { Film } from "@/types/catalog"

/** A wall of real film swatches from the hydro-dip library, with the size of the range. */
export function FilmLibraryHighlight({ films }: { films: Film[] }) {
  const library = films.filter((film) => film.isActive && film.thumbUrl)
  if (library.length === 0) return null
  // A spread across the categories rather than the first few of one.
  const byCategory = new Map<string, Film[]>()
  for (const film of library) byCategory.set(film.category, [...(byCategory.get(film.category) ?? []), film])
  const picks: Film[] = []
  for (let round = 0; picks.length < 18 && round < 18; round += 1) {
    for (const group of byCategory.values()) if (group[round] && picks.length < 18) picks.push(group[round])
  }

  return (
    <section className="grid-texture overflow-hidden bg-carbon py-16 text-paper sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="reveal space-y-6">
          <SectionHeading
            tone="light"
            eyebrow="The hydro-dip film library"
            title={
              <>
                {library.length.toLocaleString()} films.
                <span className="block text-brand">One of them is yours.</span>
              </>
            }
            description={`Carbon fibre, camo, wood, marble, skulls, animal skin and more across ${byCategory.size} collections, for helmets and kart parts alike. Search by code or browse by collection in the builder.`}
          />
          <Button asChild size="lg">
            <Link href="/helmet-builder">
              Browse films in the builder <ArrowRight />
            </Link>
          </Button>
        </div>
        <ul className="reveal grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:-rotate-2">
          {picks.map((film) => (
            <li key={film.id} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image src={film.thumbUrl!} alt={`${film.name} film`} fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
