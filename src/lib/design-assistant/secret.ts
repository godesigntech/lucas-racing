import "server-only"

/**
 * An API key from the environment, cleaned of what pasting into a hosting
 * dashboard tends to add: spaces, a line break, or wrapping quotes. Any of those
 * makes the AI services reject the key. Empty when the variable isn't set.
 */
export function secret(name: string): string {
  return (process.env[name] ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim()
}
