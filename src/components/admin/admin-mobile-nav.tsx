"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Menu } from "lucide-react"

import { Wordmark } from "@/components/layout/wordmark"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { AdminNav } from "./admin-nav"
import { useAdminUnreadCount } from "./chat/admin-unread-provider"

export function AdminMobileNav({ isFullAdmin }: { isFullAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const unread = useAdminUnreadCount()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-9 lg:hidden"
          aria-label={unread ? `Open admin menu, ${unread} conversations awaiting a reply` : "Open admin menu"}
        >
          <Menu />
          {unread > 0 && (
            <span aria-hidden className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-lime ring-2 ring-paper" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="grid-texture w-72 gap-0 border-0 bg-carbon p-4 text-paper" showCloseButton={false}>
        <SheetTitle className="sr-only">Admin menu</SheetTitle>
        <SheetDescription className="sr-only">Admin navigation</SheetDescription>
        <div className="px-2 py-2">
          <Wordmark tone="light" />
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">
          <AdminNav onNavigate={close} isFullAdmin={isFullAdmin} />
        </div>
        <Link
          href="/"
          onClick={close}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-paper/60 hover:bg-white/5 hover:text-paper"
        >
          <ExternalLink className="size-4" aria-hidden /> View website
        </Link>
      </SheetContent>
    </Sheet>
  )
}
