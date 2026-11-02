"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

/** One tab per admin page of the helmet builder, in the order of the customer's steps. */
const tabs = [
  { label: "Overview", href: "/admin/builder" },
  { step: "1", label: "Helmets", href: "/admin/builder/helmets" },
  { step: "2", label: "Aero", href: "/admin/builder/aero" },
  { step: "3", label: "Templates", href: "/admin/builder/templates" },
  { step: "4–7", label: "Colours", href: "/admin/builder/colours" },
  { step: "6", label: "Films", href: "/admin/builder/films" },
  { step: "8", label: "Lacquer", href: "/admin/builder/lacquer" },
  { step: "9–10", label: "Names & logos", href: "/admin/builder/personalisation" },
  { step: "11", label: "Exterior", href: "/admin/builder/exterior" },
  { step: "12–13", label: "Visors", href: "/admin/builder/visors" },
  { step: "15", label: "Production", href: "/admin/builder/production" },
]

export function BuilderTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Helmet builder steps" className="mb-8 rounded-2xl border border-carbon/10 bg-card p-1.5">
      <ul className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const active = tab.href === "/admin/builder" ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-carbon text-paper" : "text-muted-foreground hover:bg-smoke hover:text-carbon",
                )}
              >
                {tab.step && (
                  <span className={cn("text-xs tabular-nums", active ? "text-brand" : "text-muted-foreground/70")}>{tab.step}</span>
                )}
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
