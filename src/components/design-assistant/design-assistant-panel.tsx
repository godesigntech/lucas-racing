import { Sparkles } from "lucide-react"

import { AssistantConversation } from "./assistant-conversation"

/** The AI design assistant as a full-size panel on its own page, with room for big concept images. */
export function DesignAssistantPanel() {
  return (
    <section
      id="assistant"
      aria-label="Design assistant"
      className="flex h-[min(60rem,calc(100dvh-6rem))] min-h-[34rem] scroll-mt-24 flex-col overflow-hidden rounded-3xl bg-card shadow-[0_24px_64px_-24px_rgb(17_20_18/0.35)] ring-1 ring-carbon/10"
    >
      <header className="grid-texture flex items-center gap-3 bg-carbon px-5 py-4 text-paper sm:px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-carbon" aria-hidden>
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold uppercase leading-none">Design assistant</h2>
          <p className="mt-1 text-sm text-paper/65">Upload a photo or describe your helmet, and the AI designs it for you</p>
        </div>
      </header>
      <AssistantConversation />
    </section>
  )
}
