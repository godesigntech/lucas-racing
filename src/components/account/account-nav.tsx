"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, Package, UserRound, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const items: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Overview", href: "/account", icon: LayoutGrid },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Profile", href: "/account/profile", icon: UserRound },
]

function isActive(pathname: string, href: string) {
  return href === "/account" ? pathname === href : pathname.startsWith(href)
}

/** Tabs on mobile, a vertical list on desktop. Render inside <Suspense> (reads the URL). */
export function AccountNav() {
  const pathname = usePathname()
  return <AccountNavList isCurrent={(href) => isActive(pathname, href)} />
}

export function AccountNavFallback() {
  return <AccountNavList isCurrent={() => false} />
}

function AccountNavList({ isCurrent }: { isCurrent: (href: string) => boolean }) {
  return (
    <nav aria-label="Account">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
        {items.map(({ label, href, icon: Icon }) => {
          const active = isCurrent(href)
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors lg:rounded-xl",
                  active ? "bg-carbon text-paper" : "bg-card text-carbon/80 hover:bg-foreground/5 hover:text-carbon lg:bg-transparent",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
