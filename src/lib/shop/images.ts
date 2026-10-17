const ownStorage = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

/**
 * Photos uploaded in the admin live in our own storage and go through the image
 * optimiser. Photos from an import can be on the supplier's site, and SVG drawings
 * (the demo catalogue) can't be optimised: those are shown as they are.
 */
export function isExternalImage(url: string): boolean {
  if (/\.svg(\?|$)/i.test(url)) return true
  return !url.startsWith("/") && !(ownStorage && url.startsWith(ownStorage))
}
