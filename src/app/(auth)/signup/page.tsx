import { Suspense } from "react"
import type { Metadata } from "next"

import { AuthHeading } from "@/components/forms/auth-heading"
import { SignupForm } from "@/components/forms/signup-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Lucas Racing account to order custom helmets and track your orders.",
}

export default function SignupPage() {
  return (
    <>
      <AuthHeading
        eyebrow="Join the grid"
        title="Create account"
        description="Order custom helmets, track every order and check out faster next time."
      />
      <Suspense fallback={<Skeleton className="h-[34rem] rounded-3xl" />}>
        <SignupForm />
      </Suspense>
    </>
  )
}
