import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { AuthHeading } from "@/components/forms/auth-heading"
import { ResetPasswordForm } from "@/components/forms/reset-password-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Choose a new password for your Lucas Racing account.",
  robots: { index: false },
}

/** The link in the reset email signs the customer in (auth/confirm) and lands here. */
async function ResetPassword() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-carbon/10 bg-card p-6 text-center" role="alert">
        <h2 className="font-display text-3xl font-bold uppercase">Link expired</h2>
        <p className="text-sm text-muted-foreground">
          This reset link has expired or was already used. Ask for a new one and use the latest email.
        </p>
        <Button asChild>
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
      </div>
    )
  }
  return (
    <>
      <p className="mb-5 text-sm text-muted-foreground">
        For <strong className="text-carbon">{user.email}</strong>
      </p>
      <ResetPasswordForm />
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading eyebrow="Nearly there" title="New password" description="Choose a new password for your account." />
      <Suspense fallback={<Skeleton className="h-72 rounded-3xl" />}>
        <ResetPassword />
      </Suspense>
    </>
  )
}
