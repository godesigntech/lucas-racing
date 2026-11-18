import type { Metadata } from "next"

import { LegalDocument } from "@/components/shared/legal-document"
import document from "@/content/legal/delivery-returns"

export const metadata: Metadata = {
  title: "Delivery, Returns and Cancellations",
  description: "Delivery, collection, returns, refunds and cancellations for Lucas Racing and HydroKarts orders.",
}

export default function DeliveryReturnsandCancellationsPage() {
  return <LegalDocument document={document} intro="Delivery, collection, returns and refunds." path="/delivery-returns" />
}
