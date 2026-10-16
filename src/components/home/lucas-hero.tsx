import type { CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { images } from "@/constants/images"
import { milestones } from "@/data/about"
import { getSiteSettings } from "@/lib/data/settings"

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties

/** Homepage opener: a dark, full-height race-day hero with the paddock photo. */
export async function LucasHero() {
  const settings = await getSiteSettings()
  const event = settings.showEventBanner && settings.eventName ? settings : null

  return (
    <section className="relative isolate overflow-hidden bg-carbon text-paper">
      <div aria-hidden className="grid-texture absolute inset-0 -z-20" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 -z-10 size-[34rem] rounded-full bg-brand/20 blur-[120px]" />

      {/* The paddock photo: on top with a slanted bottom edge on small screens, filling the
          right-hand side behind a slanted edge (with an orange stripe along it) on large ones. */}
      <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:-z-10 lg:aspect-auto lg:w-[56%]">
        <div className="absolute inset-0 overflow-hidden [clip-path:polygon(0_0,100%_0,100%_86%,0_100%)] lg:[clip-path:polygon(16%_0,100%_0,100%_100%,0_100%)]">
          <Image
            src={images.fatherAndSonPaddock.src}
            alt={images.fatherAndSonPaddock.alt}
            fill
            preload
            sizes="(min-width: 1024px) 56vw, 100vw"
            className="ken-burns object-cover lg:object-[60%_center]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/20 to-transparent lg:bg-gradient-to-r lg:from-carbon/70 lg:via-carbon/10" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-carbon/80 to-transparent lg:block" />
        </div>
        <div aria-hidden className="absolute inset-0 hidden bg-brand [clip-path:polygon(16%_0,17.4%_0,1.4%_100%,0_100%)] lg:block" />
      </div>

      <Container className="relative flex flex-col justify-center pb-14 pt-4 sm:pb-16 lg:min-h-[calc(100svh-7.5rem)] lg:py-24">
        <div className="max-w-2xl space-y-7 lg:max-w-[46%]">
          <p
            className="hero-in inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-paper/80 backdrop-blur"
            style={delay(0)}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            Oldham<span className="hidden sm:inline">, Greater Manchester</span> · MS Kart since 1999
          </p>

          <h1 className="display text-[3.4rem] min-[420px]:text-[4rem] sm:text-8xl lg:text-[5.25rem] xl:text-[6.25rem] 2xl:text-[7rem]">
            <span className="hero-in block" style={delay(120)}>
              Family run.
            </span>
            <span className="hero-in block text-brand" style={delay(240)}>
              Race proven.
            </span>
          </h1>

          <p className="hero-in max-w-lg text-base leading-relaxed text-paper/70 sm:text-lg" style={delay(360)}>
            A family-run kart racing team and the exclusive UK distributor of MS Kart. Karts, parts, racing support and custom
            helmets, from people who race every weekend.
          </p>

          <div className="hero-in flex flex-col gap-3 sm:flex-row" style={delay(480)}>
            <Button asChild size="lg">
              <Link href="/shop">
                Shop MS Kart <ArrowRight className="transition-transform group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="inverse">
              <Link href="/team">Meet the team</Link>
            </Button>
          </div>

          <dl className="hero-in grid grid-cols-3 gap-4 border-t border-white/10 pt-6" style={delay(600)}>
            {milestones.map((item) => (
              <div key={item.value}>
                <dt className="font-display text-3xl font-extrabold uppercase leading-none text-paper sm:text-4xl">{item.value}</dt>
                <dd className="mt-1.5 text-xs leading-snug text-paper/55">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {event && (
          <Link
            href="/contact"
            className="hero-in group mt-10 flex max-w-sm items-center gap-4 self-start rounded-2xl border border-white/15 bg-carbon/60 p-4 backdrop-blur-md transition-colors hover:border-brand/60 lg:absolute lg:right-8 lg:top-10 lg:mt-0 lg:self-auto xl:right-12"
            style={delay(800)}
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-carbon">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="eyebrow block text-brand">Next event</span>
              <span className="block font-display text-xl font-bold uppercase leading-tight">{event.eventName}</span>
              {event.eventDates && <span className="block text-sm text-paper/65">{event.eventDates} · Come and meet the team</span>}
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-paper/50 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
          </Link>
        )}
      </Container>

      <div aria-hidden className="chequer h-3 opacity-90" />
    </section>
  )
}
