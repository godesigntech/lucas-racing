import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { FileText, ImagePlus, RefreshCw, Sparkles } from "lucide-react"

import { AssistantConversation } from "@/components/design-assistant/assistant-conversation"
import { AssistantStage } from "@/components/design-assistant/assistant-stage"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Design my helmet",
  description: "Upload examples you like or describe what you're looking for. Our AI creates a bespoke helmet design for free, with as many revisions as you need.",
}

const steps = [
  { icon: ImagePlus, title: "Show us what you like", text: "Upload a helmet you like, or describe the look you want." },
  { icon: Sparkles, title: "The AI designs it", text: "A bespoke helmet design in your colours, in about 30 seconds." },
  { icon: RefreshCw, title: "Change it for free", text: "Ask for as many new versions as you need." },
  { icon: FileText, title: "Ask for a quote", text: "Happy with it? Send it to us and we'll email you a price." },
]

/** The AI designer: the brief on the left, the result on the right. Needs an account. */
export default function DesignMyHelmetPage() {
  return (
    <section className="py-5 sm:py-10">
      <Container className="max-sm:px-3">
        <div id="assistant" className="scroll-mt-28">
          <Suspense fallback={<DesignerSkeleton />}>
            <Designer />
          </Suspense>
        </div>
      </Container>
    </section>
  )
}

async function Designer() {
  // The server actions check this too: guests can't use the AI.
  const user = await getCurrentUser()
  if (!user) return <SignInFirst />
  return <AssistantConversation />
}

/** Designing needs an account: it's how we quote, and it keeps the free AI fair for everyone. */
function SignInFirst() {
  const next = encodeURIComponent("/design-my-helmet")
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-8">
      <section aria-labelledby="ai-designer-title" className="flex min-w-0 flex-col rounded-[1.75rem] border border-carbon/10 bg-card">
        <header className="flex items-start justify-between gap-3 border-b border-carbon/10 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="eyebrow text-muted-foreground">AI helmet designer</p>
            <h1 id="ai-designer-title" className="mt-1 font-display text-3xl font-bold uppercase leading-none sm:text-4xl">
              Design my helmet
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a helmet you like or describe the look you want. Our AI designs it for free and changes it as often as you like.
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-display text-2xl font-bold uppercase leading-none sm:text-3xl">Free</span>
            <span className="text-xs text-muted-foreground">Unlimited changes</span>
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
            <span className="text-muted-foreground">A free account keeps your details ready for your quote. It takes a minute.</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/signup?next=${next}`}>Create a free account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/login?next=${next}`}>Log in</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Prefer to choose every colour yourself?{" "}
            <Link href="/helmet-builder" className="font-semibold text-brand-ink hover:underline">
              Open the 3D helmet builder
            </Link>
          </p>
        </footer>
      </section>

      <div className="lg:sticky lg:top-24">
        <AssistantStage concept={{ status: "idle" }} analysing={false} photo={null} showSteps={false} />
      </div>
    </div>
  )
}

function DesignerSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8" aria-busy="true" aria-label="Loading the AI helmet designer">
      <Skeleton className="h-[32rem] rounded-[1.75rem]" />
      <Skeleton className="aspect-square rounded-[1.75rem]" />
    </div>
  )
}
