import { Suspense } from "react"

import { mainNav } from "@/constants/navigation"
import { getSiteSettings } from "@/lib/data/settings"

import { BasketButton } from "./basket-button"
import { Container } from "./container"
import { GuestActions, HeaderAccount } from "./header-account"
import { NavLinks, StaticNavLinks } from "./nav-links"
import { Wordmark } from "./wordmark"

const desktopLink =
  "relative rounded-full px-4 py-2 text-sm font-medium text-carbon/75 transition-colors hover:text-carbon"
const desktopActive = "bg-carbon text-paper hover:text-paper"

export async function SiteHeader() {
  const settings = await getSiteSettings()
  const hasEvent = settings.showEventBanner && settings.eventName
  const eventText = hasEvent ? `See us at ${settings.eventName} · ${settings.eventDates}` : undefined

  return (
    <header className="sticky top-0 z-40">
      {hasEvent && (
        <div className="bg-carbon text-paper">
          <Container className="flex h-9 items-center justify-center gap-2 text-center text-xs">
            <span className="size-1.5 shrink-0 rounded-full bg-lime" aria-hidden />
            <span className="truncate">
              Meet the team at <strong className="font-semibold">{settings.eventName}</strong>
              {settings.eventDates && `, ${settings.eventDates}`}
            </span>
          </Container>
        </div>
      )}
      <div className="border-b border-carbon/10 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
        <Container className="flex h-16 items-center justify-between gap-3 lg:h-[4.5rem]">
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <BasketButton className="size-9 sm:size-10" />
            <Suspense fallback={<GuestActions eventText={eventText} />}>
              <HeaderAccount eventText={eventText} />
            </Suspense>
          </div>
        </Container>
      </div>
    </header>
  )
}
