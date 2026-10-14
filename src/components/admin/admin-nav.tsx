"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { adminNavSections, isAdminNavActive } from "./admin-nav-items"

interface AdminNavProps {
  onNavigate?: () => void
}

/** Sidebar navigation. Reads the URL: render inside <Suspense> with <AdminNavStatic> as fallback. */
export function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname()
  return <AdminNavList isActive={(href) => isAdminNavActive(pathname, href)} onNavigate={onNavigate} />
}

export function AdminNavStatic() {
  return <AdminNavList isActive={() => false} />
}

function AdminNavList({ isActive, onNavigate }: { isActive: (href: string) => boolean; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-6">
      {adminNavSections.map((section) => (
        <div key={section.title}>
          <p className="eyebrow mb-2 px-3 text-[0.65rem] text-paper/40">{section.title}</p>
          <ul className="space-y-0.5">
            {section.items.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-lime text-carbon" : "text-paper/70 hover:bg-white/5 hover:text-paper",
                    )}
                  >
                    <Icon className="size-[1.1rem]" aria-hidden />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
