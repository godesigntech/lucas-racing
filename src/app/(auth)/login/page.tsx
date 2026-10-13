import type { Metadata } from "next"

import { AuthHeading } from "@/components/forms/auth-heading"
import { LoginForm } from "@/components/forms/login-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your Lucas Racing account to see your saved helmet designs.",
}

export default function LoginPage() {
  return (
    <>
      <AuthHeading eyebrow="Welcome back" title="Login" description="Pick up where you left off with your saved designs." />
      <LoginForm />
    </>
  )
}
