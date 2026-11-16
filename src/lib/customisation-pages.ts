/**
 * Sections that show the Lucas Racing by HydroKarts logo in the header. Each has a layout
 * rendering <CustomisationPage /> (components/layout/header-logo.tsx); keep them in step.
 */
export const customisationPaths = ["/customisation", "/helmet-builder", "/design-my-helmet", "/kart-stickers"]

/**
 * Flags <html> while the HTML loads, before React, so a customisation page never flashes
 * the other logo. Rendered once by the root layout, which never re-renders it.
 */
export const customisationFlagScript = `(function(){var p=location.pathname;if(${JSON.stringify(customisationPaths)}.some(function(s){return p===s||p.indexOf(s+"/")===0}))document.documentElement.dataset.customisationInitial="1"})()`
