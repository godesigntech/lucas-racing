"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavItem } from "@/constants/navigation"
import { cn } from "@/lib/utils"

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

interface NavLinksProps {
  items: NavItem[]
  className?: string
  linkClassName?: string
  activeClassName?: string
  onNavigate?: () => void
}

/** Navigation links that highlight the current route. Wrap in <Suspense>. */
export function NavLinks({ items, className, linkClassName, activeClassName, onNavigate }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <ul className={className}>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(linkClassName, active && activeClassName)}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Server-safe fallback with the same markup and no active state. */
export function StaticNavLinks({ items, className, linkClassName }: Omit<NavLinksProps, "activeClassName" | "onNavigate">) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={linkClassName}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
