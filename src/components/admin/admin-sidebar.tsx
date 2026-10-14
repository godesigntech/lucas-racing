import { Suspense } from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { Wordmark } from "@/components/layout/wordmark"

import { AdminNav, AdminNavStatic } from "./admin-nav"

export function AdminSidebar() {
  return (
    <aside className="grid-texture sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-carbon px-4 py-6 text-paper lg:flex">
      <div className="px-2">
        <Wordmark tone="light" />
        <p className="eyebrow mt-3 text-[0.62rem] text-lime">Admin</p>
      </div>
      <div className="mt-8 flex-1 overflow-y-auto">
        <Suspense fallback={<AdminNavStatic />}>
          <AdminNav />
        </Suspense>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-paper/60 transition-colors hover:bg-white/5 hover:text-paper"
      >
        <ExternalLink className="size-4" aria-hidden /> View website
      </Link>
    </aside>
  )
}
