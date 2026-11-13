import type { Metadata } from "next"
import Link from "next/link"
import { FileText, ImagePlus, RefreshCw, Sparkles } from "lucide-react"

import { DesignAssistantPanel } from "@/components/design-assistant/design-assistant-panel"
import { Container } from "@/components/layout/container"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Design my helmet",
  description: "Upload examples you like or describe what you're looking for. Our AI creates a bespoke helmet design for free, with as many revisions as you need.",
}

const steps = [
  { icon: ImagePlus, title: "Show us what you like", text: "Upload a picture of a helmet you like, or describe the look you're after." },
  { icon: Sparkles, title: "Get a bespoke design", text: "Our trained AI creates a helmet design just for you, in your colours." },
  { icon: RefreshCw, title: "Change it as often as you like", text: "Ask for as many revisions as you need to get it right. It's free." },
  { icon: FileText, title: "Get a quote", text: "Happy with it? Ask for a quote straight away. No need to go through the builder." },
]

export default function DesignMyHelmetPage() {
  return (
    <>
      <PageHero
        eyebrow="Free design service"
        title="Design your helmet with AI"
        description="Upload examples you like or describe what you're looking for. Our trained AI will create a bespoke helmet design for free, with as many revisions as you need to get it right."
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
        <Container className="space-y-10">
          <DesignAssistantPanel />
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="rounded-3xl border border-carbon/10 bg-card p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent text-brand-ink">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-4 text-xs font-semibold text-muted-foreground">Step {index + 1}</p>
                <h2 className="font-display text-2xl font-bold uppercase leading-tight">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  )
}
