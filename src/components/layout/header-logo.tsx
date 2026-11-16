"use client"

import { useEffect } from "react"

import { Logo } from "./logo"

/**
 * The header logo: Lucas Racing, or Lucas Racing by HydroKarts on the customisation pages.
 * Both are in the header; CSS (globals.css) shows one according to a flag on <html>,
 * set as the page loads (customisationFlagScript, root layout) and kept up to date by
 * <CustomisationPage />. Plain CSS, so the header stays prerendered.
 */
export function HeaderLogo() {
  return (
    <>
      <Logo preload height={56} className="header-logo-default" imageClassName="h-11 w-auto lg:h-14" />
      {/* A wide wordmark: a little shorter so it fits beside the buttons on phones. */}
      <Logo variant="hydrokarts" height={48} className="header-logo-hydrokarts" imageClassName="h-8 w-auto sm:h-10 lg:h-12" />
    </>
  )
}

/**
 * Marks the page as part of Customisation while it's on screen, keeping the flag on <html>
 * in step with client-side navigation. Next.js keeps pages you've left in the page,
 * hidden, and runs their effect clean-ups, so a hidden page never keeps the flag on.
 */
export function CustomisationPage() {
  useEffect(() => {
    const root = document.documentElement
    // From here on the effect owns the flag (the load-time one would outlive the page).
    delete root.dataset.customisationInitial
    root.dataset.customisation = String(Number(root.dataset.customisation ?? 0) + 1)
    return () => {
      const remaining = Number(root.dataset.customisation ?? 1) - 1
      if (remaining > 0) root.dataset.customisation = String(remaining)
      else delete root.dataset.customisation
    }
  }, [])

  return null
}
