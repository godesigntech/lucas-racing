import Link from "next/link"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

interface WordmarkProps {
  tone?: "dark" | "light"
  className?: string
}

/** Text wordmark used until the client's logo files arrive. */
export function Wordmark({ tone = "dark", className }: WordmarkProps) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={cn("group inline-flex items-center gap-2.5 rounded-md", className)}
    >
      <span
        aria-hidden
        className="chequer size-7 shrink-0 rounded-[6px] ring-1 ring-black/10 transition-transform duration-300 group-hover:-rotate-6"
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.35rem] font-extrabold uppercase tracking-tight",
            tone === "dark" ? "text-carbon" : "text-paper",
          )}
        >
          Lucas Racing
        </span>
        <span
          className={cn(
            "font-mono text-[0.6rem] uppercase tracking-[0.22em]",
            tone === "dark" ? "text-muted-foreground" : "text-paper/60",
          )}
        >
          × {siteConfig.partner}
        </span>
      </span>
    </Link>
  )
}
