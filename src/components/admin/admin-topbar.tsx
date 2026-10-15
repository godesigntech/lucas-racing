import { Suspense } from "react"

import { AccountMenu } from "@/components/layout/account-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"

import { AdminMobileNav } from "./admin-mobile-nav"

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-carbon/10 bg-paper/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Suspense fallback={<AdminMobileNav isFullAdmin={false} />}>
          <SessionMobileNav />
        </Suspense>
        <p className="font-display text-xl font-bold uppercase lg:hidden">Admin</p>
      </div>
      <Suspense fallback={<Skeleton className="size-10 rounded-full" />}>
        <TopbarUser />
      </Suspense>
    </header>
  )
}

async function TopbarUser() {
  const user = await getCurrentUser()
  if (!user) return null
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold leading-tight">{user.fullName || "Admin"}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
      <AccountMenu user={{ fullName: user.fullName, email: user.email, isAdmin: user.isAdmin }} />
    </div>
  )
}

async function SessionMobileNav() {
  const user = await getCurrentUser()
  return <AdminMobileNav isFullAdmin={user?.role === "admin"} />
}
