"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { NavigationMenu } from "radix-ui"

import type { NavGroup } from "@/constants/navigation"
import { cn } from "@/lib/utils"

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

function isGroupActive(pathname: string | null, group: NavGroup): boolean {
  if (!pathname) return false
  return isActivePath(pathname, group.href) || Boolean(group.children?.some((child) => isActivePath(pathname, child.href)))
}

const topLink =
  "inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-carbon/75 transition-colors hover:text-carbon focus-visible:outline-2 data-[state=open]:bg-foreground/5 data-[state=open]:text-carbon"
const topActive = "bg-carbon text-paper hover:text-paper data-[state=open]:bg-carbon data-[state=open]:text-paper"

interface MenuProps {
  items: NavGroup[]
  /** Null while the route isn't known yet (static shell): nothing is highlighted. */
  pathname: string | null
}

function DesktopMenu({ items, pathname }: MenuProps) {
  return (
    <NavigationMenu.Root aria-label="Main" delayDuration={80}>
      <NavigationMenu.List className="flex items-center gap-0.5">
        {items.map((item) => {
          const active = isGroupActive(pathname, item)
          if (!item.children) {
            return (
              <NavigationMenu.Item key={item.href}>
                <NavigationMenu.Link asChild active={active}>
                  <Link href={item.href} aria-current={active ? "page" : undefined} className={cn(topLink, active && topActive)}>
                    {item.label}
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            )
          }
          return (
            <NavigationMenu.Item key={item.href} className="relative">
              <NavigationMenu.Trigger className={cn(topLink, "group", active && topActive)}>
                {item.label}
                <ChevronDown
                  className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                  aria-hidden
                />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-carbon/10 bg-card p-2 shadow-[0_24px_48px_-24px_rgb(17_20_18/0.4)] animate-in fade-in-0 slide-in-from-top-1">
                <ul className="grid gap-0.5">
                  {item.children.map((child) => {
                    const current = pathname !== null && pathname === child.href
                    return (
                      <li key={child.href}>
                        <NavigationMenu.Link asChild active={current}>
                          <Link
                            href={child.href}
                            aria-current={current ? "page" : undefined}
                            className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/5 focus-visible:bg-foreground/5 aria-[current=page]:bg-accent"
                          >
                            <span className="block text-sm font-semibold text-carbon">{child.label}</span>
                            {child.description && (
                              <span className="mt-0.5 block text-xs text-muted-foreground">{child.description}</span>
                            )}
                          </Link>
                        </NavigationMenu.Link>
                      </li>
                    )
                  })}
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          )
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}

/** Desktop menu that highlights the current section. Reads the URL: render in <Suspense> with <DesktopNavStatic>. */
export function DesktopNav({ items }: { items: NavGroup[] }) {
  return <DesktopMenu items={items} pathname={usePathname()} />
}

export function DesktopNavStatic({ items }: { items: NavGroup[] }) {
  return <DesktopMenu items={items} pathname={null} />
}

const mobileTop =
  "flex items-center justify-between rounded-xl px-3 py-2.5 font-display text-2xl font-bold uppercase tracking-tight text-carbon transition-colors hover:bg-foreground/5"
const mobileChild =
  "block rounded-lg px-3 py-2 text-sm font-medium text-carbon/75 transition-colors hover:bg-foreground/5 hover:text-carbon"

/** Mobile menu list: each section with its pages indented beneath. */
export function MobileNavList({ items, onNavigate }: { items: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isGroupActive(pathname, item)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(mobileTop, active && "bg-carbon text-paper hover:bg-carbon")}
            >
              {item.label}
            </Link>
            {item.children && (
              <ul className="mb-1 ml-4 mt-1 border-l border-carbon/10 pl-2">
                {item.children
                  .filter((child) => child.href !== item.href)
                  .map((child) => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        aria-current={pathname === child.href ? "page" : undefined}
                        className={cn(mobileChild, pathname === child.href && "bg-accent text-carbon")}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}
