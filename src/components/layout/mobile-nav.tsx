"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { authNav, mainNav } from "@/constants/navigation"
import { siteConfig } from "@/config/site"

import { NavLinks } from "./nav-links"
import { Wordmark } from "./wordmark"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm gap-0 bg-paper p-0">
        <div className="border-b px-5 py-4">
          <Wordmark />
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </div>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks
            items={mainNav}
            onNavigate={close}
            className="flex flex-col gap-1"
            linkClassName="flex items-center justify-between rounded-xl px-3 py-3 font-display text-2xl font-bold uppercase tracking-tight text-carbon transition-colors hover:bg-foreground/5"
            activeClassName="bg-carbon text-paper hover:bg-carbon"
          />
        </nav>
        <div className="grid gap-3 border-t p-5">
          <Button asChild size="lg">
            <Link href={authNav.signup.href} onClick={close}>
              {authNav.signup.label} <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={authNav.login.href} onClick={close}>
              {authNav.login.label}
            </Link>
          </Button>
          <p className="pt-1 text-center text-xs text-muted-foreground">
            See us at {siteConfig.event.name} · {siteConfig.event.dates}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
