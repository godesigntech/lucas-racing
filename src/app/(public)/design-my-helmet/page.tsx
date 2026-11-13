import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, FileText, ImagePlus, RefreshCw, Sparkles } from "lucide-react"

import { AssistantConversation } from "@/components/design-assistant/assistant-conversation"
import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Design my helmet",
  description: "Upload examples you like or describe what you're looking for. Our AI creates a bespoke helmet design for free, with as many revisions as you need.",
}

const steps = [
  { icon: ImagePlus, title: "Show us what you like", text: "Upload a picture of a helmet you like, or describe the look you're after." },
  { icon: Sparkles, title: "The AI designs it", text: "A bespoke helmet design, just for you, in your colours." },
  { icon: RefreshCw, title: "Change it for free", text: "Ask for as many new versions as you need to get it right." },
  { icon: FileText, title: "Ask for a quote", text: "Happy with it? Send it to us and we'll email you a price." },
]

export default function DesignMyHelmetPage() {
  return (
    <>
      <PageHero
        eyebrow="Free design service"
        title="Design your helmet with AI"
        description="Upload a helmet you like or describe the look you want. Our AI designs it for free, changes it as often as you like, and you can ask for a quote whenever you're happy."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href="#assistant">
              <Sparkles aria-hidden /> Start designing
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-paper hover:bg-white/10">
            <Link href="/helmet-builder">Or design it yourself</Link>
          </Button>
        </div>
      </PageHero>

      <section className="py-10 sm:py-14">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div id="assistant" className="min-w-0 scroll-mt-28">
            <AssistantConversation />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-3xl border border-carbon/10 bg-card p-5">
              <h2 className="font-display text-2xl font-bold uppercase leading-none">How it works</h2>
              <ol className="mt-4 space-y-4">
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
            </div>
            <div className="rounded-3xl bg-carbon p-5 text-paper">
              <p className="font-semibold">Prefer to design it yourself?</p>
              <p className="mt-1 text-sm text-paper/70">Pick a template and choose every colour, film and finish in 3D.</p>
              <Button asChild size="sm" variant="secondary" className="mt-3">
                <Link href="/helmet-builder">
                  Open the 3D helmet builder <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </aside>
        </Container>
      </section>
    </>
  )
}
