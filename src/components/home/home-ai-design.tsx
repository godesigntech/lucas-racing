import { ImagePlus, MessageSquareText, RefreshCw } from "lucide-react"

import { OpenAssistantButton } from "@/components/design-assistant/open-assistant-button"
import { Container } from "@/components/layout/container"

const points = [
  { icon: ImagePlus, text: "Upload examples of helmets you like" },
  { icon: MessageSquareText, text: "Or describe what you're looking for" },
  { icon: RefreshCw, text: "As many revisions as you need, free" },
]

/** The AI design service, promoted on the homepage. */
export function HomeAiDesign() {
  return (
    <section className="py-12 sm:py-16" aria-labelledby="ai-design-heading">
      <Container>
        <div className="grid-texture overflow-hidden rounded-[2rem] bg-carbon px-6 py-10 text-paper sm:px-12 sm:py-14">
          <p className="eyebrow text-brand">Free design service</p>
          <h2 id="ai-design-heading" className="mt-2 font-display text-4xl font-bold uppercase leading-none sm:text-5xl">
            Design your helmet with AI
          </h2>
          <p className="mt-4 max-w-2xl text-paper/75">
            Upload examples you like or describe what you&apos;re looking for. Our trained AI will create a bespoke helmet
            design for free, with as many revisions as you need to get it right.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10">
                <Icon className="size-5 shrink-0 text-brand" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
          <OpenAssistantButton className="mt-8" />
        </div>
      </Container>
    </section>
  )
}
