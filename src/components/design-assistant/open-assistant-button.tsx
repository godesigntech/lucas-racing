import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Where the AI design assistant lives: a full page of its own. */
export const DESIGN_ASSISTANT_HREF = "/design-my-helmet#assistant"

/** Takes the customer to the AI design assistant page. */
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
    <Button asChild size={size} variant={variant} className={className}>
      <Link href={DESIGN_ASSISTANT_HREF}>
        <Sparkles aria-hidden /> {children}
      </Link>
    </Button>
  )
}
