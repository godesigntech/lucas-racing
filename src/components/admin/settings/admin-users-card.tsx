"use client"

import { useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ShieldCheck, UserPlus, X } from "lucide-react"
import { toast } from "react-toastify"

import { runAction } from "@/components/forms/use-action-form"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addAdmin, removeAdmin, setAdminRole } from "@/lib/actions/admin/settings"
import { formatDate } from "@/lib/format"
import { adminEmailSchema, type AdminEmailValues } from "@/lib/validations/admin"
import type { AdminUser, StaffRole } from "@/types/account"

import { AdminCard } from "../admin-card"
import { ConfirmDialog } from "../confirm-dialog"

const roleLabels: Record<StaffRole, { label: string; hint: string }> = {
  admin: { label: "Admin", hint: "Everything, including prices, products, films, settings and the team" },
  sales: { label: "Sales", hint: "Orders, customers, messages, quotes and enquiries" },
}

function RoleSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id?: string
  value: StaffRole
  onChange: (role: StaffRole) => void
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as StaffRole)} disabled={disabled}>
      <SelectTrigger id={id} className="h-9 w-28 shrink-0" aria-label="Role">
        <SelectValue>{roleLabels[value].label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(roleLabels) as StaffRole[]).map((role) => (
          <SelectItem key={role} value={role}>
            <span className="flex flex-col">
              <span className="font-medium">{roleLabels[role].label}</span>
              <span className="text-xs text-muted-foreground">{roleLabels[role].hint}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function TeamMember({ admin, isYou }: { admin: AdminUser; isYou: boolean }) {
  const [isPending, startTransition] = useTransition()

  function changeRole(role: StaffRole) {
    startTransition(async () => {
      const result = await setAdminRole(admin.email, role)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
      <UserAvatar name={admin.email} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {admin.email}
          {isYou && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}
        </p>
        <p className="text-xs text-muted-foreground">Added {formatDate(admin.createdAt)}</p>
      </div>
      {isYou ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-lime-ink">
          <ShieldCheck className="size-4" aria-hidden /> {roleLabels[admin.role].label}
        </span>
      ) : (
        <div className="flex items-center gap-1">
          {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Saving" />}
          <RoleSelect value={admin.role} onChange={changeRole} disabled={isPending} />
          <ConfirmDialog
            title="Remove access?"
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
        </div>
      )}
    </li>
  )
}

export function AdminUsersCard({ admins, currentEmail }: { admins: AdminUser[]; currentEmail: string }) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminEmailValues>({ resolver: zodResolver(adminEmailSchema), defaultValues: { email: "", role: "sales" } })

  async function onSubmit(values: AdminEmailValues) {
    const result = await runAction(() => addAdmin(values), setError)
    if (result?.ok) reset({ email: "", role: values.role })
  }

  return (
    <AdminCard
      title="Team access"
      description="People who can open this admin panel. They sign in with their normal account using this email. Sales can't change prices, products, films or settings."
    >
      <ul className="divide-y divide-carbon/10">
        {admins.map((admin) => (
          <TeamMember key={admin.email} admin={admin} isYou={admin.email === currentEmail} />
        ))}
      </ul>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-2 border-t border-carbon/10 pt-5">
        <label htmlFor="new-admin" className="text-sm font-medium">
          Add someone
        </label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="new-admin"
            type="email"
            {...register("email")}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "new-admin-error" : undefined}
            placeholder="name@example.com"
            className="min-w-48 flex-1"
          />
          <Controller
            control={control}
            name="role"
            render={({ field }) => <RoleSelect value={field.value} onChange={field.onChange} />}
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
