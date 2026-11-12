import { Suspense } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { LayoutTemplate, PencilLine, Send, Sparkles } from "lucide-react"

import { KartStickerStudio } from "@/components/kart-stickers/kart-sticker-studio"
import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"
import { getMyKartStudio } from "@/lib/data/kart-stickers"
import { readyKartLayouts } from "@/lib/kart-stickers/options"

export const metadata: Metadata = {
  title: "Kart sticker designer",
  description: "Design your own kart sticker kit with AI: pick your kart's layout, describe the look, add your number, name and logos, and send it for a quote.",
}

const steps = [
  { icon: LayoutTemplate, title: "Pick your layout", text: "The blank sticker panels for your kart's bodywork." },
  { icon: PencilLine, title: "Describe your design", text: "Colours, style, number, name, logos and finish." },
  { icon: Sparkles, title: "Let the AI design it", text: "Try as many versions as you like, up to five a day." },
  { icon: Send, title: "Send it for a quote", text: "We check it, prepare it for print and send you a price." },
]

export default function KartStickersPage() {
  return (
    <>
      <PageHero
        eyebrow="Kart stickers"
        title="Design your kart stickers with AI"
        description="Pick your kart's sticker layout, describe the look you want and our AI designs the whole kit: nassau, side pods and front bumper. Happy with it? Send it to us for a quote."
      />
      <section className="py-10 sm:py-14">
        <Container className="space-y-10">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-2xl border border-carbon/10 bg-card p-4">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-brand-ink">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-3 text-xs font-semibold text-muted-foreground">Step {index + 1}</p>
                <h2 className="font-display text-lg font-bold uppercase leading-tight">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <Suspense fallback={<Skeleton className="h-[40rem] rounded-3xl" />}>
            <Studio />
          </Suspense>
        </Container>
      </section>
    </>
  )
}

async function Studio() {
  const user = await getCurrentUser()
  if (!user) return <SignInFirst />
  const { designs, remaining, limit } = await getMyKartStudio(user.id)
  return <KartStickerStudio initialDesigns={designs} initialRemaining={remaining} limit={limit} />
}

/** Designing needs an account: the AI's designs are kept in it, and it's how we quote. */
function SignInFirst() {
  const next = encodeURIComponent("/kart-stickers")
  return (
    <div className="grid items-center gap-8 rounded-3xl border border-carbon/10 bg-card p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <h2 className="font-display text-3xl font-bold uppercase leading-tight">Log in to start designing</h2>
        <p className="mt-2 text-muted-foreground">
          A free account keeps all your designs together and lets you send your favourite for a quote. It takes a minute.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={`/signup?next=${next}`}>Create an account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/login?next=${next}`}>Log in</Link>
          </Button>
        </div>
      </div>
      {readyKartLayouts[0] && (
        <div className="overflow-hidden rounded-2xl border border-carbon/10 bg-white">
          <Image src={readyKartLayouts[0].image} alt={`${readyKartLayouts[0].name} blank sticker layout`} width={readyKartLayouts[0].width} height={readyKartLayouts[0].height} className="h-auto w-full" />
          <p className="border-t border-carbon/10 px-4 py-2 text-xs text-muted-foreground">{readyKartLayouts[0].name} layout: nassau, side pods and front bumper</p>
        </div>
      )}
    </div>
  )
}
