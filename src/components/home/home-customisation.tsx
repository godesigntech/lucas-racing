import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Box, Droplets, Sparkles } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { brandLogos } from "@/constants/brand"
import { helmetPhotos } from "@/constants/images"

const highlights = [
  { icon: Box, text: "Design it step by step and turn it in 3D" },
  { icon: Droplets, text: "Hundreds of hydro-dip films, paint and in-house chrome" },
  { icon: Sparkles, text: "Your name, number and logos, approved on a proof first" },
]

/** Customisation by HydroKarts: helmets now, bespoke MS Kart parts next. */
export function HomeCustomisation() {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_75%_40%,#ffffff,#e8e7e0_70%)] py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="reveal space-y-6">
          <Image
            src={brandLogos.lucasRacingByHydroKarts.src}
            alt={brandLogos.lucasRacingByHydroKarts.alt}
            width={brandLogos.lucasRacingByHydroKarts.width}
            height={brandLogos.lucasRacingByHydroKarts.height}
            sizes="(min-width: 640px) 360px, 280px"
            className="h-14 w-auto sm:h-16"
          />
          <h2 className="display text-5xl sm:text-6xl">
            Customisation,
            <span className="block text-brand">your colours</span>
          </h2>
          <p className="max-w-xl leading-relaxed text-carbon/75">
            Custom Arai SK-6 and Bell KC7 kart helmets, designed with you and finished by HydroKarts. Bespoke MS Kart parts
            in your own finish are on the way.
          </p>
          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-carbon text-brand">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/helmet-builder">
                Design your helmet <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/customisation">Browse designs</Link>
            </Button>
          </div>
          <Link
            href="/customisation/kart-parts"
            className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
          >
            MS Kart parts by HydroKarts <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="reveal relative mx-auto grid w-full max-w-lg grid-cols-[1.1fr_1fr] items-end">
          <Image
            src={helmetPhotos.araiSk6.src}
            alt={helmetPhotos.araiSk6.alt}
            width={helmetPhotos.araiSk6.width}
            height={helmetPhotos.araiSk6.height}
            sizes="(min-width: 1024px) 26vw, 50vw"
            className="relative z-10 drop-shadow-[0_30px_30px_rgb(17_20_18/0.35)]"
          />
          <Image
            src={helmetPhotos.bellKc7.src}
            alt={helmetPhotos.bellKc7.alt}
            width={helmetPhotos.bellKc7.width}
            height={helmetPhotos.bellKc7.height}
            sizes="(min-width: 1024px) 24vw, 45vw"
            className="-ml-8 mb-10 drop-shadow-[0_30px_30px_rgb(17_20_18/0.3)]"
          />
        </div>
      </Container>
    </section>
  )
}
