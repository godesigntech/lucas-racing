import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { authNav, mainNav } from "@/constants/navigation"

import { Container } from "./container"
import { MobileNav } from "./mobile-nav"
import { NavLinks, StaticNavLinks } from "./nav-links"
import { Wordmark } from "./wordmark"

const desktopLink =
  "relative rounded-full px-4 py-2 text-sm font-medium text-carbon/75 transition-colors hover:text-carbon"
const desktopActive = "bg-carbon text-paper hover:text-paper"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-carbon text-paper">
        <Container className="flex h-9 items-center justify-center gap-2 text-center text-xs">
          <span className="size-1.5 rounded-full bg-lime" aria-hidden />
          <span className="truncate">
            Meet the team at <strong className="font-semibold">{siteConfig.event.name}</strong>,{" "}
            {siteConfig.event.dates}
          </span>
        </Container>
      </div>
      <div className="border-b border-carbon/10 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
        <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          <Wordmark />

          <nav aria-label="Main" className="hidden lg:block">
            <Suspense
              fallback={<StaticNavLinks items={mainNav} className="flex items-center gap-1" linkClassName={desktopLink} />}
            >
              <NavLinks
                items={mainNav}
                className="flex items-center gap-1"
                linkClassName={desktopLink}
                activeClassName={desktopActive}
              />
            </Suspense>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href={authNav.login.href}>{authNav.login.label}</Link>
            </Button>
            <Button asChild className="h-9 px-4 sm:h-10 sm:px-5">
              <Link href={authNav.signup.href}>
                {authNav.signup.label}
                <ArrowRight className="hidden transition-transform group-hover/button:translate-x-0.5 sm:block" />
              </Link>
            </Button>
            <MobileNav />
          </div>
        </Container>
      </div>
    </header>
  )
}
