"use client"

import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"

import { OPEN_ASSISTANT_EVENT } from "@/components/design-assistant/design-assistant"
import { Button } from "@/components/ui/button"

/** How long someone designs (with the page in view) before we offer AI help. */
const AFTER_MS = 5 * 60 * 1000
const DISMISSED_KEY = "lucas-racing:ai-nudge-dismissed"

/**
 * After a while designing, offer the AI designer: a few pictures of helmets they like, and
 * it designs one for them. Shown once per visit, and only while the page is in view.
 */
export function AiHelpNudge({ engaged }: { engaged: boolean }) {
  const [due, setDue] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY)) return
    } catch {
      // Storage blocked: the nudge just may show again next visit.
    }
    let spent = 0
    let last = Date.now()
    const tick = window.setInterval(() => {
      const now = Date.now()
      if (document.visibilityState === "visible") spent += now - last
      last = now
      if (spent >= AFTER_MS) {
        setDue(true)
        window.clearInterval(tick)
      }
    }, 5000)
    return () => window.clearInterval(tick)
  }, [])

  function dismiss() {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1")
    } catch {
      // Ignore: it only controls whether the nudge shows again this visit.
    }
  }

  if (!due || !engaged || dismissed) return null
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl bg-carbon p-4 text-paper">
      <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Want a hand with your design?</p>
        <p className="mt-0.5 text-sm text-paper/75">
          Upload a few pictures of helmets you like, or describe what you want, and our AI will design one just for you. Free, with as many changes as you need.
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-3"
          onClick={() => {
            window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))
            dismiss()
          }}
        >
          <Sparkles /> Design it with AI
        </Button>
      </div>
      <button type="button" onClick={dismiss} className="grid size-8 shrink-0 place-items-center rounded-lg text-paper/70 hover:bg-white/10 hover:text-paper" aria-label="No thanks">
        <X className="size-4" />
      </button>
    </div>
  )
}
