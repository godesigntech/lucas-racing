"use client"

import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

import { OPEN_ASSISTANT_EVENT } from "./design-assistant"

/** Opens the AI design assistant from anywhere on the site. */
export function OpenAssistantButton({
  children = "Design my helmet with AI",
  size = "lg",
  variant = "default",
  className,
}: {
  children?: React.ReactNode
  size?: "sm" | "default" | "lg"
  variant?: "default" | "outline"
  className?: string
}) {
  return (
    <Button type="button" size={size} variant={variant} className={className} onClick={() => window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))}>
      <Sparkles /> {children}
    </Button>
  )
}
