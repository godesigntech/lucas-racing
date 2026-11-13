import { Suspense } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { LayoutTemplate, PencilLine, Send, Sparkles } from "lucide-react"

import { KartStickerStudio } from "@/components/kart-stickers/kart-sticker-studio"
import { Container } from "@/components/layout/container"
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

/** Laid out like the helmet builder: the picture on the left, the steps on the right. */
export default function KartStickersPage() {
  return (
    <section className="py-5 sm:py-10">
      <Container className="max-sm:px-3">
        <Suspense fallback={<StudioSkeleton />}>
          <Studio />
        </Suspense>
      </Container>
    </section>
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
  const layout = readyKartLayouts[0]
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-8">
      <section aria-labelledby="kart-stickers-title" className="flex min-w-0 flex-col rounded-[1.75rem] border border-carbon/10 bg-card">
        <header className="border-b border-carbon/10 px-5 py-5 sm:px-6">
          <p className="eyebrow text-muted-foreground">Kart sticker designer</p>
          <h1 id="kart-stickers-title" className="mt-1 font-display text-3xl font-bold uppercase leading-none sm:text-4xl">
            Design my kart stickers
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick your kart&apos;s layout, describe the look and our AI designs the whole kit. Happy with it? Send it to us for a quote.
          </p>
        </header>
        <ol className="space-y-4 px-5 py-5 sm:px-6">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-brand-ink">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="text-sm">
                <span className="block text-[0.7rem] font-semibold text-muted-foreground">Step {index + 1}</span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ol>
        <footer className="space-y-3 rounded-b-[1.75rem] border-t border-carbon/10 bg-carbon/[0.03] px-5 py-5 sm:px-6">
          <p className="text-sm">
            <span className="font-semibold">Log in to start designing.</span>{" "}
            <span className="text-muted-foreground">A free account keeps your designs together so you can send your favourite for a quote.</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/signup?next=${next}`}>Create a free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/login?next=${next}`}>Log in</Link>
            </Button>
          </div>
        </footer>
      </section>

      {layout && (
        <figure className="overflow-hidden rounded-[1.75rem] border border-carbon/10 bg-card lg:sticky lg:top-24">
          <div className="relative aspect-square bg-white lg:aspect-[5/4]">
            <Image src={layout.image} alt={`${layout.name} blank sticker layout`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain p-4" preload />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-carbon px-3 py-1 text-xs font-semibold text-paper">
              <LayoutTemplate className="size-3.5 text-brand" aria-hidden /> {layout.name} layout
            </span>
          </div>
          <figcaption className="px-4 py-3 text-xs text-muted-foreground">
            <span className="font-semibold text-carbon">One of {readyKartLayouts.length} kart layouts.</span> The AI fills these panels with your design:
            nassau, side pods and front bumper.
          </figcaption>
        </figure>
      )}
    </div>
  )
}

function StudioSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8" aria-busy="true" aria-label="Loading the kart sticker designer">
      <Skeleton className="h-[32rem] rounded-[1.75rem]" />
      <Skeleton className="aspect-square rounded-[1.75rem]" />
    </div>
  )
}
