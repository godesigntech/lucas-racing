"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "react-toastify"

import { AdminCard } from "@/components/admin/admin-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updatePartsDiscounts } from "@/lib/actions/admin/settings"
import type { PartsDiscountTier } from "@/types/settings"

/** Admin > Settings > Discounts: the kart parts quantity discount steps. */
export function PartsDiscountCard({ tiers }: { tiers: PartsDiscountTier[] }) {
  const [rows, setRows] = useState(() => tiers.map((tier) => ({ parts: String(tier.parts), percent: String(tier.percent) })))
  const [pending, startTransition] = useTransition()
  const change = (index: number, key: "parts" | "percent", value: string) => setRows((current) => current.map((row, at) => (at === index ? { ...row, [key]: value } : row)))

  function save() {
    startTransition(async () => {
      const result = await updatePartsDiscounts(rows.map((row) => ({ parts: Number(row.parts), percent: Number(row.percent) })))
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  return (
    <AdminCard
      title="Kart parts quantity discount"
      description="Custom-finished kart parts get cheaper the more a customer orders at once. A pair or set counts as one part. Only custom-finished parts are discounted, not helmets or stock parts."
    >
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-muted-foreground">
          <span>From this many parts</span>
          <span>% off those parts</span>
          <span className="sr-only">Remove</span>
        </div>
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
            <Input aria-label={`Step ${index + 1}: number of parts`} type="number" min={2} max={50} value={row.parts} onChange={(event) => change(index, "parts", event.target.value)} />
            <div className="relative">
              <Input aria-label={`Step ${index + 1}: percent off`} type="number" min={1} max={90} value={row.percent} onChange={(event) => change(index, "percent", event.target.value)} className="pr-8" />
              <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove step ${index + 1}`} onClick={() => setRows((current) => current.filter((_, at) => at !== index))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No steps: kart parts have no quantity discount.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-carbon/10 pt-4">
          <Button type="button" variant="outline" onClick={() => setRows((current) => [...current, { parts: String((Number(current.at(-1)?.parts) || 1) + 1), percent: "" }])}>
            <Plus /> Add a step
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden />} Save discounts
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">The highest step a basket reaches applies. Example: with 2 → 10% and 5 → 40%, three parts get 10% and six parts get 40%.</p>
      </div>
    </AdminCard>
  )
}
