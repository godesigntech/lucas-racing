/**
 * A return address that stays on this site: a path starting with one "/". Anything else
 * (another site, "//evil.com", "/\\evil.com" which browsers read as "//evil.com", or
 * control characters) gives the fallback.
 */
export function safeRedirectPath(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback
  if (next.includes("\\") || /[\u0000-\u001f\u007f]/.test(next)) return fallback
  try {
    // Resolved against a placeholder site: it must still be on that site.
    const base = "https://site.invalid"
    return new URL(next, base).origin === base ? next : fallback
  } catch {
    return fallback
  }
}
