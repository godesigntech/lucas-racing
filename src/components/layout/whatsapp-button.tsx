import { SocialIcon } from "@/components/shared/social-icon"
import { getSiteSettings } from "@/lib/data/settings"

/**
 * A floating "Chat on WhatsApp" button, bottom right. Shown when a WhatsApp link is set
 * in Admin > Settings > Social links. Hidden on phones in the design tools
 * (data-floating-launcher, globals.css), where it would cover their buttons.
 */
export async function WhatsAppButton() {
  const settings = await getSiteSettings()
  const link = settings.socialLinks.find((item) => item.icon === "whatsapp" && item.href)
  if (!link) return null

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      data-floating-launcher
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25d366] pl-4 pr-4 font-semibold text-white shadow-[0_12px_32px_-8px_rgb(17_20_18/0.6)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25d366]/50 active:scale-95 sm:pr-5"
    >
      <SocialIcon name="whatsapp" className="size-7" />
      <span className="max-sm:sr-only">WhatsApp us</span>
    </a>
  )
}
