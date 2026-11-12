import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, Gift, Trophy } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { competitionPrizes } from "@/lib/competition/prizes"
import { formatClosing } from "@/lib/competition/status"
import { getCompetition } from "@/lib/data/competition"

/** Three of the templates, fanned out behind the copy. */
const showcase = ["crimson-bolt", "inferno", "pink-blade"]

/**
 * The helmet competition, high on the homepage while it's coming up or taking entries.
 * Nothing shows once entries have closed.
 */
export async function HomeCompetition() {
  const competition = await getCompetition()
  if (!competition || (competition.status !== "upcoming" && competition.status !== "open")) return null
  const vouchers = competitionPrizes.filter((prize) => prize.percentOff)

  return (
    <section className="py-12 sm:py-16" aria-labelledby="home-competition-heading">
      <Container>
        <div className="grid-texture relative overflow-hidden rounded-[2rem] bg-carbon text-paper">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/25 blur-3xl" />
          <div className="relative grid gap-8 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <p className="eyebrow flex items-center gap-2 text-brand">
                <Trophy className="size-4" aria-hidden /> Competition · free to enter
              </p>
              <h2 id="home-competition-heading" className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] sm:text-6xl">
                Win a custom Arai SK-6
              </h2>
              <p className="mt-4 max-w-xl text-paper/75">
                Design your helmet in our studio with at least one hydrographic film, share it and enter. The winning design is made for real on a
                brand-new Arai SK-6, with a spoiler and clear visor.
              </p>
              <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <li className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <Gift className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                  <span>
                    Every eligible entrant wins a voucher: {vouchers.map((prize) => `${prize.percentOff}%`).join(", ")} off a custom helmet finish
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <CalendarDays className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                  <span>
                    {competition.closesAt ? `Entries close ${formatClosing(competition.closesAt)}` : "Entries open soon"}
                  </span>
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/helmet-builder?competition=1">
                    Design your entry <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-transparent text-paper hover:bg-white/10 hover:text-paper">
                  <Link href="/competition">How to enter</Link>
                </Button>
              </div>
            </div>

            <div aria-hidden className="relative mx-auto h-64 w-full max-w-md sm:h-80">
              {showcase.map((slug, index) => (
                <span
                  key={slug}
                  className={[
                    "absolute top-1/2 w-[58%] -translate-y-1/2 overflow-hidden rounded-3xl bg-paper shadow-2xl ring-1 ring-white/10",
                    index === 0 ? "left-0 -rotate-6" : index === 1 ? "left-1/2 z-10 -translate-x-1/2 scale-110" : "right-0 rotate-6",
                  ].join(" ")}
                >
                  <Image src={`/models/templates/bell-kc7/${slug}/thumbnail.png`} alt="" width={290} height={250} className="h-auto w-full" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
