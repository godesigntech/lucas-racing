"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { FormField, fieldA11y } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { addBlackout, clearWeekCapacity, deleteBlackout, setWeekCapacity } from "@/lib/actions/admin/production"
import { formatUkDateShort, formatWeek } from "@/lib/dates/uk"
import { cn } from "@/lib/utils"
import { blackoutSchema, capacitySchema, type BlackoutValues, type CapacityValues } from "@/lib/validations/production"
import type { ProductionBlackout, ProductionWeek } from "@/types/production"

/**
 * The production calendar: one row per bookable week, how full it is, and what the
 * workshop has overridden. Weeks are Mondays, Europe/London — the same unit
 * book_production_slot() counts against.
 */
export function CapacityCalendar({ weeks, blackouts }: { weeks: ProductionWeek[]; blackouts: ProductionBlackout[] }) {
  const [editing, setEditing] = useState<ProductionWeek | null>(null)
  const [addingBlackout, setAddingBlackout] = useState(false)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <AdminCard title="Production calendar" description="How many helmets can still start in each week." flush>
        <ul className="divide-y divide-carbon/10">
          {weeks.map((week) => {
            const full = week.available <= 0
            return (
              <li key={week.weekStart} className="flex items-center gap-3 px-5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{formatWeek(week.weekStart)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {week.booked} of {week.slots} booked
                    {week.isBlackedOut ? " · workshop closed" : ""}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                    week.isBlackedOut
                      ? "bg-carbon/8 text-carbon ring-carbon/15"
                      : full
                        ? "bg-destructive/10 text-destructive ring-destructive/25"
                        : "bg-accent text-brand-ink ring-brand-ink/25",
                  )}
                >
                  {week.isBlackedOut ? "Closed" : full ? "Full" : `${week.available} free`}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(week)}>
                  Change
                </Button>
              </li>
            )
          })}
          {weeks.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              No bookable weeks. Check the booking notice and weeks-ahead settings.
            </li>
          )}
        </ul>
      </AdminCard>

      <AdminCard
        title="Workshop closed"
        description="Dates nobody can book production into: holidays, race weekends, a shutdown."
        flush
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => setAddingBlackout(true)}>
            <Plus /> Add dates
          </Button>
        }
      >
        <ul className="divide-y divide-carbon/10">
          {blackouts.map((blackout) => (
            <li key={blackout.id} className="flex items-center gap-3 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {blackout.startsOn === blackout.endsOn
                    ? formatUkDateShort(blackout.startsOn)
                    : `${formatUkDateShort(blackout.startsOn)} – ${formatUkDateShort(blackout.endsOn)}`}
                </span>
                {blackout.reason && <span className="block truncate text-xs text-muted-foreground">{blackout.reason}</span>}
              </span>
              <ConfirmDialog
                title="Remove these closed dates?"
                description="Customers will be able to start production that week again."
                confirmLabel="Remove"
                onConfirm={async () => (await deleteBlackout(blackout.id)).ok}
                trigger={
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove closed dates">
                    <Trash2 />
                  </Button>
                }
              />
            </li>
          ))}
          {blackouts.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">The workshop is open throughout.</li>
          )}
        </ul>
      </AdminCard>

      {editing && <CapacityDialog week={editing} onClose={() => setEditing(null)} />}
      {addingBlackout && <BlackoutDialog onClose={() => setAddingBlackout(false)} />}
    </div>
  )
}

function CapacityDialog({ week, onClose }: { week: ProductionWeek; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CapacityValues>({
    resolver: zodResolver(capacitySchema),
    defaultValues: { weekStart: week.weekStart, slots: week.slots, note: "" },
  })

  async function onSubmit(values: CapacityValues) {
    const result = await runAction(() => setWeekCapacity(values), setError)
    if (result?.ok) onClose()
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{formatWeek(week.weekStart)}</DialogTitle>
          <DialogDescription>
            {week.booked} already booked. Setting fewer slots than that won&apos;t cancel anything — it just stops new
            bookings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <input type="hidden" {...register("weekStart")} />
          <FormField id="week-slots" label="Helmets that can start this week" error={errors.slots?.message}>
            <Input type="number" min={0} {...register("slots", { valueAsNumber: true })} {...fieldA11y("week-slots", errors.slots?.message)} />
          </FormField>
          <FormField id="week-note" label="Note" hint="Only the workshop sees this." error={errors.note?.message} optional>
            <Input {...register("note")} {...fieldA11y("week-note", errors.note?.message, true)} placeholder="Two painters off" />
          </FormField>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const result = await clearWeekCapacity(week.weekStart)
                if (result.ok) onClose()
              }}
            >
              <RotateCcw /> Use the standing capacity
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              Save week
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BlackoutDialog({ onClose }: { onClose: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BlackoutValues>({
    resolver: zodResolver(blackoutSchema),
    defaultValues: { startsOn: "", endsOn: "", reason: "" },
  })

  async function onSubmit(values: BlackoutValues) {
    const result = await runAction(() => addBlackout(values), setError)
    if (result?.ok) onClose()
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Workshop closed</DialogTitle>
          <DialogDescription>Production can&apos;t start on these dates. Both days are included.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="blackout-from" label="First day" error={errors.startsOn?.message}>
              <Input type="date" {...register("startsOn")} {...fieldA11y("blackout-from", errors.startsOn?.message)} />
            </FormField>
            <FormField id="blackout-to" label="Last day" error={errors.endsOn?.message}>
              <Input type="date" {...register("endsOn")} {...fieldA11y("blackout-to", errors.endsOn?.message)} />
            </FormField>
          </div>
          <FormField id="blackout-reason" label="Reason" error={errors.reason?.message} optional>
            <Input {...register("reason")} {...fieldA11y("blackout-reason", errors.reason?.message)} placeholder="Christmas shutdown" />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              Add dates
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
