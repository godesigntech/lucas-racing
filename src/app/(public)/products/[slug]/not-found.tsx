import Link from "next/link"
import { HelpCircle } from "lucide-react"

import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export default function ProductNotFound() {
  return (
    <Container className="py-20">
      <EmptyState
        icon={HelpCircle}
        title="Design not found"
        description="That helmet design doesn't exist or has been renamed. Browse the full range instead."
        action={
          <Button asChild>
            <Link href="/products">Browse all designs</Link>
          </Button>
        }
      />
    </Container>
  )
}
