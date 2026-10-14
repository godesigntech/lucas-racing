"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "@/lib/actions/auth"
import { isRedirectError } from "@/lib/is-redirect"
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth"

import { fieldA11y, FormField } from "./form-field"
import { PasswordInput } from "./password-input"

export function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get("next") ?? undefined
  const linkError = searchParams.get("error") === "link"

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await signIn(values, next)
      // On success the action redirects, so we only get here on failure.
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof LoginFormValues, { message })
        }
        toast.error(result.message)
      }
    } catch (error) {
      if (isRedirectError(error)) throw error
      toast.error("We couldn't reach the server. Check your connection and try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {linkError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          That link has expired or was already used. Log in, or sign up again to get a new one.
        </p>
      )}

      <FormField id="login-email" label="Email" error={errors.email?.message}>
        <Input
          {...register("email")}
          {...fieldA11y("login-email", errors.email?.message)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </FormField>

      <FormField id="login-password" label="Password" error={errors.password?.message}>
        <PasswordInput
          {...register("password")}
          {...fieldA11y("login-password", errors.password?.message)}
          autoComplete="current-password"
          placeholder="Your password"
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Logging in…" : "Login"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Lucas Racing?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-semibold text-carbon underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}
