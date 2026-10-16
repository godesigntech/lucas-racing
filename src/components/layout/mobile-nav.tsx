"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, LayoutDashboard, LogOut, Menu, Package, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { authNav, mainNav } from "@/constants/navigation"
import { signOut } from "@/lib/actions/auth"

import type { MenuUser } from "./account-menu"
import { MobileNavList } from "./nav-links"
import { Logo } from "./logo"

interface MobileNavProps {
  user: MenuUser | null
  eventText?: string
}

const accountLink =
  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-carbon transition-colors hover:bg-foreground/5"

export function MobileNav({ user, eventText }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="size-9 sm:size-10 xl:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm gap-0 bg-paper p-0">
        <div className="border-b px-5 py-4">
          <Logo />
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </div>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
          <MobileNavList items={[...mainNav, { label: "Basket", href: "/basket" }]} onNavigate={close} />
        </nav>

        <div className="grid gap-3 border-t p-5">
          {user ? (
            <>
              <p className="px-3 text-xs text-muted-foreground">
                Signed in as <span className="font-semibold text-carbon">{user.fullName || user.email}</span>
              </p>
              <Link href="/account" onClick={close} className={accountLink}>
                <UserRound className="size-4" aria-hidden /> My account
              </Link>
              <Link href="/account/orders" onClick={close} className={accountLink}>
                <Package className="size-4" aria-hidden /> Orders
              </Link>
              {user.isAdmin && (
                <Link href="/admin" onClick={close} className={accountLink}>
                  <LayoutDashboard className="size-4" aria-hidden /> Admin dashboard
                </Link>
              )}
              <form action={signOut}>
                <Button type="submit" variant="outline" size="lg" className="w-full">
                  <LogOut /> Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
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
            </>
          )}
          {eventText && <p className="pt-1 text-center text-xs text-muted-foreground">{eventText}</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}
