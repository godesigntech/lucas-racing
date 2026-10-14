"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { fieldA11y, FormField } from "@/components/forms/form-field"
import { PasswordInput } from "@/components/forms/password-input"
import { runAction } from "@/components/forms/use-action-form"
import { InfoCard } from "@/components/orders/info-card"
import { Button } from "@/components/ui/button"
import { changePassword } from "@/lib/actions/account"
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validations/auth"

export function PasswordForm() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit(values: ChangePasswordValues) {
    const result = await runAction(() => changePassword(values), setError)
    if (result?.ok) reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <InfoCard title="Change password">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="new-password"
            label="New password"
            hint="At least 8 characters, with a capital letter and a number."
            error={errors.password?.message}
          >
            <PasswordInput
              {...register("password")}
              {...fieldA11y("new-password", errors.password?.message, true)}
              autoComplete="new-password"
            />
          </FormField>
          <FormField id="confirm-new-password" label="Confirm new password" error={errors.confirmPassword?.message}>
            <PasswordInput
              {...register("confirmPassword")}
              {...fieldA11y("confirm-new-password", errors.confirmPassword?.message)}
              autoComplete="new-password"
            />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end">
          <Button type="submit" variant="secondary" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </div>
      </InfoCard>
    </form>
  )
}
