"use client"

import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { changePassword } from "@/lib/actions/account"
import { cn } from "@/lib/utils"
import { changePasswordSchema, passwordRules, type ChangePasswordValues } from "@/lib/validations/auth"

import { fieldA11y, FormField } from "./form-field"
import { PasswordInput } from "./password-input"

/** Shown after the customer opens the link in their reset email, which signs them in. */
export function ResetPasswordForm() {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })
  const password = useWatch({ control, name: "password" })

  async function onSubmit(values: ChangePasswordValues) {
    try {
      const result = await changePassword(values)
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof ChangePasswordValues, { message })
        }
        toast.error(result.message)
        return
      }
      toast.success("Your new password is set.")
      router.replace("/account")
    } catch {
      toast.error("We couldn't reach the server. Check your connection and try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FormField id="reset-password" label="New password" error={errors.password?.message}>
        <PasswordInput
          {...register("password")}
          {...fieldA11y("reset-password", errors.password?.message)}
          autoComplete="new-password"
          placeholder="Choose a new password"
        />
      </FormField>
      <ul className="-mt-2 grid gap-1 text-xs sm:grid-cols-3" aria-label="Password requirements">
        {passwordRules.map((rule) => {
          const met = rule.test(password ?? "")
          return (
            <li key={rule.label} className={cn("flex items-center gap-1.5", met ? "text-brand-ink" : "text-muted-foreground")}>
              <Check className={cn("size-3.5", !met && "opacity-30")} aria-hidden />
              {rule.label}
              <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
            </li>
          )
        })}
      </ul>

      <FormField id="reset-confirm" label="Confirm new password" error={errors.confirmPassword?.message}>
        <PasswordInput
          {...register("confirmPassword")}
          {...fieldA11y("reset-confirm", errors.confirmPassword?.message)}
          autoComplete="new-password"
          placeholder="Type it again"
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
        {isSubmitting ? "Saving…" : "Save new password"}
      </Button>
    </form>
  )
}
