"use client"

import Link from "next/link"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { previewSignUp } from "@/lib/services/auth-preview"
import { cn } from "@/lib/utils"
import { passwordRules, signupSchema, type SignupFormValues } from "@/lib/validations/auth"

import { fieldA11y, FormField } from "./form-field"
import { PasswordInput } from "./password-input"

export function SignupForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  })
  const password = useWatch({ control, name: "password" })

  async function onSubmit(values: SignupFormValues) {
    try {
      const result = await previewSignUp(values)
      toast.success(result.message)
      reset()
    } catch {
      toast.error("We couldn't reach the server. Check your connection and try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField id="signup-name" label="Full name" error={errors.fullName?.message}>
        <Input
          {...register("fullName")}
          {...fieldA11y("signup-name", errors.fullName?.message)}
          autoComplete="name"
          placeholder="Alex Driver"
        />
      </FormField>

      <FormField id="signup-email" label="Email" error={errors.email?.message}>
        <Input
          {...register("email")}
          {...fieldA11y("signup-email", errors.email?.message)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </FormField>

      <FormField id="signup-password" label="Password" error={errors.password?.message}>
        <PasswordInput
          {...register("password")}
          {...fieldA11y("signup-password", errors.password?.message)}
          autoComplete="new-password"
          placeholder="Create a password"
        />
      </FormField>
      <ul className="-mt-2 grid gap-1 text-xs sm:grid-cols-3" aria-label="Password requirements">
        {passwordRules.map((rule) => {
          const met = rule.test(password ?? "")
          return (
            <li key={rule.label} className={cn("flex items-center gap-1.5", met ? "text-lime-ink" : "text-muted-foreground")}>
              <Check className={cn("size-3.5", !met && "opacity-30")} aria-hidden />
              {rule.label}
              <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
            </li>
          )
        })}
      </ul>

      <FormField id="signup-confirm" label="Confirm password" error={errors.confirmPassword?.message}>
        <PasswordInput
          {...register("confirmPassword")}
          {...fieldA11y("signup-confirm", errors.confirmPassword?.message)}
          autoComplete="new-password"
          placeholder="Type it again"
        />
      </FormField>

      <Controller
        control={control}
        name="acceptTerms"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="signup-terms"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.error ? true : undefined}
                aria-describedby={fieldState.error ? "signup-terms-error" : undefined}
                className="mt-0.5"
              />
              <Label htmlFor="signup-terms" className="block text-sm font-normal leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="font-semibold underline underline-offset-4">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-semibold underline underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
            {fieldState.error && (
              <p id="signup-terms-error" role="alert" className="text-xs font-medium text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-carbon underline-offset-4 hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}
