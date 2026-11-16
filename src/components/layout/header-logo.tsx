"use client"

import { usePathname } from "next/navigation"

import { Logo } from "./logo"

/** Pages that are part of Customisation: they show the Lucas Racing by HydroKarts logo. */
const customisationPaths = ["/customisation", "/helmet-builder", "/design-my-helmet", "/kart-stickers"]

export function isCustomisationPage(pathname: string) {
  return customisationPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/** The header logo: Lucas Racing, or Lucas Racing by HydroKarts on the customisation pages. */
export function HeaderLogo() {
  const pathname = usePathname() ?? ""
  if (isCustomisationPage(pathname)) {
    // A wide wordmark: a little shorter so it fits beside the buttons on phones.
    return <Logo preload variant="hydrokarts" height={48} imageClassName="h-8 w-auto sm:h-10 lg:h-12" />
  }
  return <Logo preload height={56} imageClassName="h-11 w-auto lg:h-14" />
}
