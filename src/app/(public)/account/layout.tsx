import { Suspense } from "react"
import type { Metadata } from "next"
import { LogOut } from "lucide-react"

import { AccountNav, AccountNavFallback } from "@/components/account/account-nav"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"

export const metadata: Metadata = {
  title: { default: "My account", template: "%s | My account" },
  robots: { index: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-10 sm:py-14">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow hidden text-brand-ink lg:block">My account</p>
          <Suspense fallback={<AccountNavFallback />}>
            <AccountNav />
          </Suspense>
          <form action={signOut} className="hidden lg:block">
            <Button type="submit" variant="ghost" className="w-full justify-start rounded-xl px-4 text-muted-foreground">
              <LogOut /> Sign out
            </Button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </Container>
    </section>
  )
}
