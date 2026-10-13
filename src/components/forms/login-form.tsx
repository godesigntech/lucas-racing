"use client"

import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { previewLogin } from "@/lib/services/auth-preview"
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth"

import { fieldA11y, FormField } from "./form-field"
import { PasswordInput } from "./password-input"

export function LoginForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await previewLogin(values)
      toast.info(result.message)
    } catch {
      toast.error("We couldn't reach the server. Check your connection and try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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

      <Controller
        control={control}
        name="remember"
        render={({ field }) => (
          <div className="flex items-center gap-3">
            <Checkbox id="login-remember" checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
            <Label htmlFor="login-remember" className="text-sm font-normal">
              Keep me signed in on this device
            </Label>
          </div>
        )}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Signing in…" : "Login"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Lucas Racing?{" "}
        <Link href="/signup" className="font-semibold text-carbon underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
