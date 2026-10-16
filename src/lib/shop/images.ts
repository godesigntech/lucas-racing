const ownStorage = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""

/**
 * Photos uploaded in the admin live in our own storage and go through the image
 * optimiser. Photos from an import can be on the supplier's site: those are shown
 * as they are (next/image only optimises hosts we've allowed).
 */
export function isExternalImage(url: string): boolean {
  return !url.startsWith("/") && !(ownStorage && url.startsWith(ownStorage))
}
