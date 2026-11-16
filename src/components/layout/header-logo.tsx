import { Logo } from "./logo"

/**
 * The header logo: Lucas Racing, or Lucas Racing by HydroKarts on the customisation pages.
 * Both are in the header; a customisation page renders <CustomisationPage /> and CSS
 * (globals.css) shows the HydroKarts one. Plain CSS, so the header stays prerendered
 * and the right logo shows on first paint with no flicker.
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

/** Marks a page as part of Customisation, so the header shows the Lucas Racing by HydroKarts logo. */
export function CustomisationPage() {
  return <span hidden data-customisation-page />
}
