import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { authNav } from "@/constants/navigation"
import { getCurrentUser } from "@/lib/auth/session"

import { AccountMenu } from "./account-menu"
import { MobileNav } from "./mobile-nav"

interface HeaderAccountProps {
  eventText?: string
}

/** Login/Sign up for guests, the account menu for signed-in users. Reads the session: render in <Suspense>. */
export async function HeaderAccount({ eventText }: HeaderAccountProps) {
  const user = await getCurrentUser()

  if (!user) return <GuestActions eventText={eventText} />

  const menuUser = { fullName: user.fullName, email: user.email, isAdmin: user.isAdmin }
  return (
    <>
      <AccountMenu user={menuUser} />
      <MobileNav user={menuUser} eventText={eventText} />
    </>
  )
}

/** Also used as the Suspense fallback, so the header never looks empty. */
export function GuestActions({ eventText }: HeaderAccountProps) {
  return (
    <>
      <Button asChild variant="ghost" className="hidden sm:inline-flex">
        <Link href={authNav.login.href}>{authNav.login.label}</Link>
      </Button>
      <Button asChild className="h-9 px-3.5 sm:h-10 sm:px-5">
        <Link href={authNav.signup.href}>
          {authNav.signup.label}
          <ArrowRight className="hidden transition-transform group-hover/button:translate-x-0.5 sm:block" />
        </Link>
      </Button>
      <MobileNav user={null} eventText={eventText} />
    </>
  )
}
