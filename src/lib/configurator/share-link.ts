/**
 * The packed part of a builder share link ("d"): JSON as base64url. Encoded as UTF-8, so
 * names like "Łukasz" or "Zoë" work (plain btoa() throws on them and crashed the builder).
 */
export function encodeShared(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Reads a packed value back, or null if it isn't one. Links made before UTF-8 still open. */
export function decodeShared(packed: string): unknown {
  try {
    const binary = atob(packed.replace(/-/g, "+").replace(/_/g, "/"))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    let json: string
    try {
      json = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    } catch {
      // An older link, packed character by character.
      json = binary
    }
    return JSON.parse(json)
  } catch {
    return null
  }
}
