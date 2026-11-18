"use client"

import { useState } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"

/** Choices the website remembers on this device (Cookie Policy: everything else is needed for a service you asked for). */
const PREFERENCE_PREFIXES = ["lucas-racing:ai-nudge-dismissed", "lucas-racing:competition-promo:"]

/**
 * The cookie settings on the Cookie Policy: the website uses no optional cookies, so there
 * is nothing to switch on or off. Visitors can clear the choices it remembers (closed
 * messages); the basket and login are kept, as they're needed for what the visitor asked for.
 */
export function CookieChoices() {
  const [cleared, setCleared] = useState(false)

  function clearPreferences() {
    try {
      for (const storage of [window.localStorage, window.sessionStorage]) {
        for (const key of Object.keys(storage)) {
          if (PREFERENCE_PREFIXES.some((prefix) => key.startsWith(prefix))) storage.removeItem(key)
        }
      }
      setCleared(true)
      toast.success("Your saved choices on this device are cleared.")
    } catch {
      toast.error("Your browser didn't allow that. You can clear this website's data in your browser settings.")
    }
  }

  return (
    <section id="your-choices" aria-labelledby="your-choices-title" className="scroll-mt-24 space-y-4 rounded-3xl border border-carbon/10 bg-card p-6">
      <h2 id="your-choices-title" className="font-display text-3xl font-bold uppercase">
        Cookie settings
      </h2>
      <p className="leading-relaxed text-carbon/80">
        This website only uses the cookies and storage listed above, which are needed for things you ask for: staying logged in, keeping your basket
        and your design, and remembering messages you closed. There are no analytics, advertising or tracking cookies to switch on or off.
      </p>
      <p className="leading-relaxed text-carbon/80">
        You can clear the choices remembered on this device (such as closed messages) here. Your basket and login stay as they are. To remove
        everything, clear this website&apos;s data in your browser settings.
      </p>
      <Button type="button" variant="outline" onClick={clearPreferences} disabled={cleared}>
        {cleared ? "Choices cleared" : "Clear my saved choices"}
      </Button>
    </section>
  )
}
