// Plain-text helpers for news posts (summaries, meta descriptions, reading time).
// No server-only imports: the admin editor uses them too.

/** Markdown to plain text, roughly: good enough for summaries and word counts. */
export function markdownToText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** The post's own summary, or the start of the article. */
export function summaryOf(excerpt: string, body: string, length = 160): string {
  if (excerpt.trim()) return excerpt.trim()
  const text = markdownToText(body)
  if (text.length <= length) return text
  return `${text.slice(0, text.lastIndexOf(" ", length - 1) || length - 1).replace(/[,.;:]$/, "")}…`
}

export function readingMinutes(body: string): number {
  const words = markdownToText(body).split(" ").filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90)
}

/** True when a publish time is still to come (the post is scheduled). */
export function isFuture(value: string | null | undefined): boolean {
  return Boolean(value) && Date.parse(value!) > Date.now()
}
