"use client"

import { Sparkles } from "lucide-react"

import { OPEN_ASSISTANT_EVENT } from "@/components/design-assistant/design-assistant"
import { Button } from "@/components/ui/button"

/** Opens the floating design assistant from a page. */
export function OpenAssistantButton({ children = "Try the design assistant" }: { children?: React.ReactNode }) {
  return (
    <Button size="lg" onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}>
      <Sparkles aria-hidden /> {children}
    </Button>
  )
}
