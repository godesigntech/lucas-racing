import { Suspense } from "react"

import { CustomerChatLauncher } from "@/components/chat/customer-chat-launcher"
import { DesignAssistant } from "@/components/design-assistant/design-assistant"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-lime px-4 py-2 font-semibold text-carbon focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={null}>
        <CustomerChatLauncher />
      </Suspense>
      <DesignAssistant />
    </>
  )
}
