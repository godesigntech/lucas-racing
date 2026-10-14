"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ShieldCheck, UserPlus, X } from "lucide-react"
import { toast } from "react-toastify"

import { runAction } from "@/components/forms/use-action-form"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addAdmin, removeAdmin } from "@/lib/actions/admin/settings"
import { formatDate } from "@/lib/format"
import type { AdminUser } from "@/types/account"
import { adminEmailSchema, type AdminEmailValues } from "@/lib/validations/admin"

import { AdminCard } from "../admin-card"
import { ConfirmDialog } from "../confirm-dialog"

export function AdminUsersCard({ admins, currentEmail }: { admins: AdminUser[]; currentEmail: string }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminEmailValues>({ resolver: zodResolver(adminEmailSchema), defaultValues: { email: "" } })

  async function onSubmit(values: AdminEmailValues) {
    const result = await runAction(() => addAdmin(values), setError)
    if (result?.ok) reset()
  }

  return (
    <AdminCard
      title="Admin access"
      description="People who can open this admin panel. They sign in with their normal account using this email."
    >
      <ul className="divide-y divide-carbon/10">
        {admins.map((admin) => {
          const isYou = admin.email === currentEmail
          return (
            <li key={admin.email} className="flex items-center gap-3 py-3 first:pt-0">
              <UserAvatar name={admin.email} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {admin.email}
                  {isYou && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">Added {formatDate(admin.createdAt)}</p>
              </div>
              {isYou ? (
                <ShieldCheck className="size-4 text-lime-ink" aria-label="Your access" />
              ) : (
                <ConfirmDialog
                  title="Remove admin access?"
                  description={`${admin.email} will no longer be able to open the admin panel. Their customer account is unaffected.`}
                  confirmLabel="Remove access"
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove ${admin.email}`}>
                      <X />
                    </Button>
                  }
                  onConfirm={async () => {
                    const result = await removeAdmin(admin.email)
                    if (result.ok) toast.success(result.message)
                    else toast.error(result.message)
                    return result.ok
                  }}
                />
              )}
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-2 border-t border-carbon/10 pt-5">
        <label htmlFor="new-admin" className="text-sm font-medium">
          Add an admin
        </label>
        <div className="flex gap-2">
          <Input
            id="new-admin"
            type="email"
            {...register("email")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "new-admin-error" : undefined}
            placeholder="name@example.com"
          />
          <Button type="submit" disabled={isSubmitting} className="shrink-0">
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus />}
            Add
          </Button>
        </div>
        {errors.email && (
          <p id="new-admin-error" className="text-xs font-medium text-destructive">
            {errors.email.message}
          </p>
        )}
      </form>
    </AdminCard>
  )
}
