import Link from "next/link"
import { EyeOff } from "lucide-react"

import { Container } from "@/components/layout/container"

/** Shown to admins while MS Kart parts by HydroKarts is hidden from the public. */
export function PreviewNotice() {
  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-900">
      <Container className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:gap-3">
        <EyeOff className="hidden size-4 shrink-0 sm:block" aria-hidden />
        <p>
          <span className="font-semibold">Admin preview.</span> Customers see a &ldquo;coming soon&rdquo; page until the branding is
          approved.{" "}
          <Link href="/admin/settings" className="font-semibold underline underline-offset-2">
            Make it public in Settings
          </Link>
        </p>
      </Container>
    </div>
  )
}
