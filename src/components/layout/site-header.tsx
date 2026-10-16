import { Suspense } from "react"

import { mainNav } from "@/constants/navigation"
import { getSiteSettings } from "@/lib/data/settings"

import { BasketButton } from "./basket-button"
import { Container } from "./container"
import { GuestActions, HeaderAccount } from "./header-account"
import { DesktopNav, DesktopNavStatic } from "./nav-links"
import { Logo } from "./logo"

export async function SiteHeader() {
  const settings = await getSiteSettings()
  const hasEvent = settings.showEventBanner && settings.eventName
  const eventText = hasEvent ? `See us at ${settings.eventName} · ${settings.eventDates}` : undefined

  return (
    <header className="sticky top-0 z-40">
      {hasEvent && (
        <div className="bg-carbon text-paper">
          <Container className="flex h-9 items-center justify-center gap-2 text-center text-xs">
            <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
            <span className="truncate">
              Meet the team at <strong className="font-semibold">{settings.eventName}</strong>
              {settings.eventDates && `, ${settings.eventDates}`}
            </span>
          </Container>
        </div>
      )}
      <div className="border-b border-carbon/10 bg-paper/85 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
        <Container className="flex h-16 items-center justify-between gap-3 lg:h-[4.5rem]">
          <Logo preload height={38} />

          {/* Eight sections need the room: below xl the menu lives in the slide-out sheet. */}
          <div className="hidden xl:block">
            <Suspense fallback={<DesktopNavStatic items={mainNav} />}>
              <DesktopNav items={mainNav} />
            </Suspense>
          </div>

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
