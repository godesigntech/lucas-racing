import { Suspense } from "react"
import type { Metadata } from "next"

import { AuthHeading } from "@/components/forms/auth-heading"
import { LoginForm } from "@/components/forms/login-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your Lucas Racing account to see your orders and saved details.",
}

export default function LoginPage() {
  return (
    <>
      <AuthHeading eyebrow="Welcome back" title="Login" description="See your orders and check out faster." />
      <Suspense fallback={<Skeleton className="h-72 rounded-3xl" />}>
        <LoginForm />
      </Suspense>
    </>
  )
}
