import Link from "next/link"
import { ArrowLeft, Bookmark, MessageSquare, Sparkles } from "lucide-react"

import { HelmetArt } from "@/components/helmet/helmet-art"
import { Wordmark } from "@/components/layout/wordmark"
import type { HelmetLook } from "@/types/helmet"

const panelLook: HelmetLook = {
  layout: "shard",
  finish: "gloss",
  base: "#1f5bd8",
  graphic: "#c6f432",
  accent: "#f4f3ee",
  film: "carbon",
  trim: "#c6f432",
  spoiler: true,
  number: "29",
}

const perks = [
  { icon: Bookmark, text: "Save designs and come back to them later" },
  { icon: MessageSquare, text: "Message the workshop about your helmet" },
  { icon: Sparkles, text: "First access to the 3D helmet builder" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Wordmark />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-carbon"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to site
          </Link>
        </div>
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {children}
        </main>
      </div>

      <aside className="grid-texture relative hidden overflow-hidden bg-carbon p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-32 top-20 size-[28rem] rounded-full bg-lime/15 blur-3xl" />
        <p className="eyebrow relative text-lime">Your Lucas Racing account</p>
        <div className="relative mx-auto w-full max-w-lg">
          <HelmetArt look={panelLook} className="drop-shadow-[0_30px_40px_rgb(0_0_0/0.5)]" />
        </div>
        <ul className="relative space-y-4">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-paper/80">
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-lime">
                <Icon className="size-4" aria-hidden />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
