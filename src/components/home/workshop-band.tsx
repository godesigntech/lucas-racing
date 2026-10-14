import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Droplets, PaintBucket, ShieldCheck } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { images } from "@/constants/images"

const steps = [
  { icon: PaintBucket, title: "Masked and prepped by hand", body: "Every line is masked to the approved proof." },
  { icon: Droplets, title: "Hydro-dipped in-house", body: "Films wrap every curve of the shell, chrome included." },
  { icon: ShieldCheck, title: "Lacquered to last", body: "A 2K clear coat in gloss or matte seals the finish." },
]

/** Full-bleed workshop photo with the finishing process laid over it. */
export function WorkshopBand() {
  return (
    <section className="relative isolate overflow-hidden bg-carbon py-20 text-paper sm:py-28">
      <Image src={images.workshop.src} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-40" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-carbon via-carbon/85 to-carbon/50" />
      <Container className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="max-w-xl space-y-5">
          <p className="eyebrow text-lime">The Hydro Karts workshop</p>
          <h2 className="display text-4xl sm:text-6xl">Finished by hand, not by a print shop</h2>
          <p className="text-base leading-relaxed text-paper/70 sm:text-lg">
            Your design goes from screen to shell in our own workshop. The people who approve your proof are the people
            who dip it.
          </p>
          <Button asChild size="lg">
            <Link href="/about">
              Meet the team <ArrowRight />
            </Link>
          </Button>
        </div>

        <ol className="space-y-3">
          {steps.map(({ icon: Icon, title, body }, index) => (
            <li
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-carbon/60 p-5 backdrop-blur"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime text-carbon">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-[0.68rem] text-paper/45">STEP {String(index + 1).padStart(2, "0")}</p>
                <h3 className="font-display text-2xl font-bold uppercase leading-tight">{title}</h3>
                <p className="mt-1 text-sm text-paper/65">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
