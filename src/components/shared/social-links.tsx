import { cn } from "@/lib/utils"
import type { SocialLink } from "@/types/settings"

import { SocialIcon } from "./social-icon"

interface SocialLinksProps {
  links: SocialLink[]
  businessName: string
  className?: string
}

/** Round icon links to the business's social profiles (managed in Admin > Settings). */
export function SocialLinks({ links, businessName, className }: SocialLinksProps) {
  if (links.length === 0) return null
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Social media">
      {links.map((item) => (
        <li key={`${item.icon}-${item.href}`}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${businessName} on ${item.label}`}
            className="grid size-10 place-items-center rounded-full border border-white/15 text-paper/80 transition-colors hover:border-lime hover:text-lime"
          >
            <SocialIcon name={item.icon} className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  )
}
