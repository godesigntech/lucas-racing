"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Trophy, X } from "lucide-react"

/** Pages where the pop-up would get in the way, or already says the same. */
const HIDDEN_ON = ["/competition", "/helmet-builder", "/checkout", "/login", "/signup", "/account"]

/**
 * A small card in the corner telling visitors about the competition. It appears a few
 * seconds after they arrive and, once closed (or followed), stays closed in this browser.
 */
export function CompetitionPromo({ competitionId, closing }: { competitionId: string; closing: string | null }) {
  const pathname = usePathname()
  const storageKey = `lucas-racing:competition-promo:${competitionId}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(storageKey) === "dismissed"
    } catch {
      // Storage blocked: show it, it just won't be remembered.
    }
    if (dismissed) return
    const timer = window.setTimeout(() => setVisible(true), 4000)
    return () => window.clearTimeout(timer)
  }, [storageKey])

  if (!visible || HIDDEN_ON.some((path) => pathname.startsWith(path))) return null

  function dismiss() {
    setVisible(false)
    try {
      localStorage.setItem(storageKey, "dismissed")
    } catch {
      // Nothing to remember it in.
    }
  }

  return (
    <aside
      aria-label="Helmet competition"
      className="fixed bottom-24 left-4 z-40 sm:bottom-4 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-carbon text-paper shadow-2xl ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-4"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2.5 top-2.5 z-10 grid size-8 place-items-center rounded-full bg-black/40 text-paper hover:bg-black/60"
        aria-label="Close"
      >
        <X className="size-4" aria-hidden />
      </button>
      <div className="flex gap-4 p-4">
        <span className="w-20 shrink-0 sm:w-24 overflow-hidden rounded-2xl bg-paper">
          <Image src="/models/templates/bell-kc7/crimson-bolt/thumbnail.png" alt="" width={290} height={250} className="h-auto w-full" />
        </span>
        <div className="min-w-0 pr-6">
          <p className="eyebrow flex items-center gap-1.5 text-brand">
            <Trophy className="size-3.5" aria-hidden /> Competition
          </p>
          <p className="mt-1 font-display text-xl font-bold uppercase leading-tight">Win a custom Arai SK-6</p>
          <p className="mt-1 text-xs text-paper/70">Free to enter. Every eligible entrant gets a helmet voucher.{closing ? ` Closes ${closing}.` : ""}</p>
        </div>
      </div>
      <Link
        href="/competition"
        onClick={dismiss}
        className="block bg-brand px-4 py-3 text-center text-sm font-semibold text-carbon transition-colors hover:bg-brand/90"
      >
        See how to enter
      </Link>
    </aside>
  )
}
