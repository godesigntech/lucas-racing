import type { Metadata } from "next"

import { AuthHeading } from "@/components/forms/auth-heading"
import { SignupForm } from "@/components/forms/signup-form"

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Lucas Racing account to save helmet designs and message the workshop.",
}

export default function SignupPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Join the grid"
        title="Create account"
        description="Save your helmet designs, share them and send them to the workshop when you're ready."
      />
      <SignupForm />
    </>
  )
}
