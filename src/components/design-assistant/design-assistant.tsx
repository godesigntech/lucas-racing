"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, X } from "lucide-react"

import { cn } from "@/lib/utils"

import { AssistantConversation } from "./assistant-conversation"

const PANEL_ID = "design-assistant-panel"

/** Floating design assistant, bottom right, for guests and customers alike. Reads no session, so it renders in the static shell. */
export function DesignAssistant() {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const launcher = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        launcher.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  function close() {
    setOpen(false)
    launcher.current?.focus()
  }

  return (
    <>
      {hasOpened && (
        <section
          id={PANEL_ID}
          role="dialog"
          aria-label="Design assistant"
          hidden={!open}
          className="fixed z-50 flex flex-col overflow-hidden bg-card shadow-[0_24px_64px_-16px_rgb(17_20_18/0.45)] ring-1 ring-carbon/10 max-sm:inset-0 sm:bottom-24 sm:right-5 sm:h-[min(42rem,calc(100dvh-8rem))] sm:w-[25rem] sm:rounded-3xl"
        >
          <header className="grid-texture flex items-center gap-3 bg-carbon px-4 py-3.5 text-paper">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime text-carbon" aria-hidden>
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold uppercase leading-none">Design assistant</h2>
              <p className="mt-1 text-xs text-paper/65">Turn a photo into a helmet concept</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="grid size-9 place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/10 hover:text-paper"
              aria-label="Close design assistant"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>
          <AssistantConversation onNavigate={() => setOpen(false)} />
        </section>
      )}

      <button
        ref={launcher}
        type="button"
        data-floating-launcher
        onClick={() => {
          setHasOpened(true)
          setOpen((value) => !value)
        }}
        aria-expanded={open}
        aria-controls={hasOpened ? PANEL_ID : undefined}
        aria-label={open ? "Close design assistant" : "Open the design assistant"}
        className={cn(
          "fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-lime px-4 font-semibold text-carbon shadow-[0_12px_32px_-8px_rgb(17_20_18/0.55)] ring-1 ring-carbon/10 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-carbon/30 active:scale-95 max-sm:w-14 max-sm:justify-center max-sm:px-0",
          open && "max-sm:hidden",
        )}
      >
        {open ? <X className="size-6" aria-hidden /> : <Sparkles className="size-6" aria-hidden />}
        <span className="max-sm:sr-only">{open ? "Close" : "Design my helmet"}</span>
      </button>
    </>
  )
}
