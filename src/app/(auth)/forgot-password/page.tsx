import type { Metadata } from "next"

import { AuthHeading } from "@/components/forms/auth-heading"
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Get a link to choose a new password for your Lucas Racing account.",
}

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Locked out?"
        title="Forgot password"
        description="Enter the email you signed up with and we'll send you a link to choose a new password."
      />
      <ForgotPasswordForm />
    </>
  )
}
