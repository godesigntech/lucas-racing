import type { SocialIconName } from "@/types/settings"

/** Simple brand glyphs (Lucide no longer ships brand icons). */
export function SocialIcon({ name, className }: { name: SocialIconName; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", "aria-hidden": true } as const

  switch (name) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3h2.6V21h3.2Z" />
        </svg>
      )
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.6 3c.3 2.1 1.6 3.5 3.6 3.7v3a7.1 7.1 0 0 1-3.5-1.1v6.2a5.7 5.7 0 1 1-5.7-5.7l.9.1v3.1a2.6 2.6 0 1 0 1.8 2.5V3h2.9Z" />
        </svg>
      )
  }
}
