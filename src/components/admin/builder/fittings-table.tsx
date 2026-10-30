"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Trash2 } from "lucide-react"

import { AdminCard } from "@/components/admin/admin-card"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { OptionPriceInput } from "@/components/admin/money-input"
import { FormField, fieldA11y } from "@/components/forms/form-field"
import { runAction } from "@/components/forms/use-action-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  deleteAeroKit,
  deleteVisor,
  saveAeroKit,
  saveVisor,
} from "@/lib/actions/admin/builder-catalog"
import { formatOptionPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  aeroKitSchema,
  visorSchema,
  type AeroKitValues,
  type VisorValues,
} from "@/lib/validations/builder-admin"
import type { HelmetModel } from "@/types/helmet"
import type { AeroKit, Visor, VisorKind } from "@/types/templates"

/**
 * Aero kits and visors. Both are small catalogues scoped to one helmet, so they share
 * a list and differ only in their form. A blank price means "not agreed yet": the option
 * still shows in the builder, and checkout refuses it.
 */

function PriceTag({ price }: { price: number | null }) {
  return (
    <span className={cn("text-xs font-semibold", price === null ? "text-amber-700" : "text-brand-ink")}>
      {price === null ? "No price set" : formatOptionPrice(price) || "Included"}
    </span>
  )
}

function Row({
  title,
  subtitle,
  price,
  isActive,
  swatch,
  onEdit,
  onDelete,
  deleteTitle,
}: {
  title: string
  subtitle: string
  price: number | null
  isActive: boolean
  swatch?: string
  onEdit: () => void
  onDelete: () => Promise<boolean>
  deleteTitle: string
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      {swatch && <span aria-hidden className="size-7 shrink-0 rounded-full ring-1 ring-carbon/20" style={{ backgroundColor: swatch }} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {title}
          {!isActive && <span className="ml-2 text-xs font-normal text-muted-foreground">(hidden)</span>}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <PriceTag price={price} />
      <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
        Edit
      </Button>
      <ConfirmDialog
        title={deleteTitle}
        description="Orders already placed keep what they chose."
        confirmLabel="Remove"
        onConfirm={onDelete}
        trigger={
          <Button type="button" variant="ghost" size="icon" aria-label={deleteTitle}>
            <Trash2 />
          </Button>
        }
      />
    </li>
  )
}

export function AeroKitTable({ kits, models }: { kits: AeroKit[]; models: HelmetModel[] }) {
  const [editing, setEditing] = useState<AeroKit | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <AdminCard
      title="Aero kits"
      description="Step 2 of the builder. The standard shell, plus any spoiler that fits."
      flush
      action={
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus /> Add a kit
        </Button>
      }
    >
      <ul className="divide-y divide-carbon/10">
        {kits.map((kit) => (
          <Row
            key={kit.id}
            title={kit.name}
            subtitle={`${models.find((model) => model.id === kit.modelId)?.name ?? kit.modelId}${kit.meshName ? ` · ${kit.meshName}` : " · standard shell"}`}
            price={kit.price}
            isActive={kit.isActive}
            onEdit={() => setEditing(kit)}
            onDelete={async () => (await deleteAeroKit(kit.id)).ok}
            deleteTitle={`Remove ${kit.name}?`}
          />
        ))}
        {kits.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">No aero kits yet.</li>}
      </ul>

      {(adding || editing) && (
        <AeroKitDialog
          kit={editing}
          models={models}
          nextSortOrder={kits.reduce((highest, kit) => Math.max(highest, kit.sortOrder), 0) + 1}
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
        />
      )}
    </AdminCard>
  )
}

function AeroKitDialog({
  kit,
  models,
  nextSortOrder,
  onClose,
}: {
  kit: AeroKit | null
  models: HelmetModel[]
  nextSortOrder: number
  onClose: () => void
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AeroKitValues>({
    resolver: zodResolver(aeroKitSchema),
    defaultValues: {
      id: kit?.id ?? "",
      modelId: kit?.modelId ?? models[0]?.id ?? "",
      name: kit?.name ?? "",
      summary: kit?.summary ?? "",
      meshName: kit?.meshName ?? "",
      price: kit?.price ?? null,
      isActive: kit?.isActive ?? true,
      sortOrder: kit?.sortOrder ?? nextSortOrder,
    },
  })

  async function onSubmit(values: AeroKitValues) {
    const result = await runAction(() => saveAeroKit(!kit, values), setError)
    if (result?.ok) onClose()
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{kit ? `Edit ${kit.name}` : "Add an aero kit"}</DialogTitle>
          <DialogDescription>Leave the price blank until the client confirms it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="aero-name" label="Name" error={errors.name?.message}>
              <Input {...register("name")} {...fieldA11y("aero-name", errors.name?.message)} />
            </FormField>
            <FormField id="aero-id" label="Id" hint="Lowercase, no spaces." error={errors.id?.message}>
              <Input {...register("id")} {...fieldA11y("aero-id", errors.id?.message, true)} disabled={Boolean(kit)} />
            </FormField>
          </div>
          <FormField id="aero-summary" label="Summary" error={errors.summary?.message} optional>
            <Input {...register("summary")} {...fieldA11y("aero-summary", errors.summary?.message)} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="aero-model" label="Helmet" error={errors.modelId?.message}>
              <select
                {...register("modelId")}
                {...fieldA11y("aero-model", errors.modelId?.message)}
                className="h-10 w-full rounded-xl border border-carbon/15 bg-card px-3 text-sm"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="aero-mesh" label="Mesh name" hint="In the .glb. Blank for the standard shell." error={errors.meshName?.message} optional>
              <Input {...register("meshName")} {...fieldA11y("aero-mesh", errors.meshName?.message, true)} placeholder="Spoiler_HP7_F1_Small" />
            </FormField>
            <FormField id="aero-price" label="Price" hint="Blank means price on request." error={errors.price?.message} optional>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <OptionPriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} {...fieldA11y("aero-price", errors.price?.message, true)} />
                )}
              />
            </FormField>
            <FormField id="aero-sort" label="Order" error={errors.sortOrder?.message}>
              <Input type="number" min={0} {...register("sortOrder", { valueAsNumber: true })} {...fieldA11y("aero-sort", errors.sortOrder?.message)} />
            </FormField>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-xl bg-paddock/40 px-4 py-2.5 text-sm">
            <span className="font-semibold">Offer this kit</span>
            <Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Offer this kit" />} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {kit ? "Save kit" : "Add kit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const visorKinds: VisorKind[] = ["clear", "smoked", "coloured", "iridium"]

export function VisorTable({ visors, models }: { visors: Visor[]; models: HelmetModel[] }) {
  const [editing, setEditing] = useState<Visor | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <AdminCard
      title="Visors"
      description="Step 12 of the builder. Tint and mirror settings drive the 3D preview."
      flush
      action={
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus /> Add a visor
        </Button>
      }
    >
      <ul className="divide-y divide-carbon/10">
        {visors.map((visor) => (
          <Row
            key={visor.id}
            title={visor.name}
            subtitle={`${models.find((model) => model.id === visor.modelId)?.name ?? visor.modelId} · ${visor.kind}`}
            price={visor.price}
            isActive={visor.isActive}
            swatch={visor.tint}
            onEdit={() => setEditing(visor)}
            onDelete={async () => (await deleteVisor(visor.id)).ok}
            deleteTitle={`Remove ${visor.name}?`}
          />
        ))}
        {visors.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted-foreground">No visors yet.</li>}
      </ul>

      {(adding || editing) && (
        <VisorDialog
          visor={editing}
          models={models}
          nextSortOrder={visors.reduce((highest, visor) => Math.max(highest, visor.sortOrder), 0) + 1}
          onClose={() => {
            setAdding(false)
            setEditing(null)
          }}
        />
      )}
    </AdminCard>
  )
}

function VisorDialog({
  visor,
  models,
  nextSortOrder,
  onClose,
}: {
  visor: Visor | null
  models: HelmetModel[]
  nextSortOrder: number
  onClose: () => void
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VisorValues>({
    resolver: zodResolver(visorSchema),
    defaultValues: {
      id: visor?.id ?? "",
      modelId: visor?.modelId ?? models[0]?.id ?? "",
      name: visor?.name ?? "",
      kind: visor?.kind ?? "clear",
      tint: visor?.tint ?? "#ffffff",
      opacity: visor?.opacity ?? 0.35,
      metalness: visor?.metalness ?? 0,
      price: visor?.price ?? null,
      isActive: visor?.isActive ?? true,
      sortOrder: visor?.sortOrder ?? nextSortOrder,
    },
  })

  async function onSubmit(values: VisorValues) {
    const result = await runAction(() => saveVisor(!visor, values), setError)
    if (result?.ok) onClose()
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{visor ? `Edit ${visor.name}` : "Add a visor"}</DialogTitle>
          <DialogDescription>
            Tint is the colour, cover is how much it hides the face, and mirror is how reflective it looks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="visor-name" label="Name" error={errors.name?.message}>
              <Input {...register("name")} {...fieldA11y("visor-name", errors.name?.message)} />
            </FormField>
            <FormField id="visor-id" label="Id" hint="Lowercase, no spaces." error={errors.id?.message}>
              <Input {...register("id")} {...fieldA11y("visor-id", errors.id?.message, true)} disabled={Boolean(visor)} />
            </FormField>
            <FormField id="visor-model" label="Helmet" error={errors.modelId?.message}>
              <select
                {...register("modelId")}
                {...fieldA11y("visor-model", errors.modelId?.message)}
                className="h-10 w-full rounded-xl border border-carbon/15 bg-card px-3 text-sm"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="visor-kind" label="Type" error={errors.kind?.message}>
              <select
                {...register("kind")}
                {...fieldA11y("visor-kind", errors.kind?.message)}
                className="h-10 w-full rounded-xl border border-carbon/15 bg-card px-3 text-sm capitalize"
              >
                {visorKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="visor-tint" label="Tint" error={errors.tint?.message}>
              <Input {...register("tint")} {...fieldA11y("visor-tint", errors.tint?.message)} placeholder="#2b2f36" />
            </FormField>
            <FormField id="visor-price" label="Price" hint="Blank means price on request." error={errors.price?.message} optional>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <OptionPriceInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} {...fieldA11y("visor-price", errors.price?.message, true)} />
                )}
              />
            </FormField>
            <FormField id="visor-opacity" label="Cover (0–1)" error={errors.opacity?.message}>
              <Input type="number" min={0} max={1} step={0.01} {...register("opacity", { valueAsNumber: true })} {...fieldA11y("visor-opacity", errors.opacity?.message)} />
            </FormField>
            <FormField id="visor-metalness" label="Mirror (0–1)" error={errors.metalness?.message}>
              <Input type="number" min={0} max={1} step={0.01} {...register("metalness", { valueAsNumber: true })} {...fieldA11y("visor-metalness", errors.metalness?.message)} />
            </FormField>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-xl bg-paddock/40 px-4 py-2.5 text-sm">
            <span className="font-semibold">Offer this visor</span>
            <Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Offer this visor" />} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
              {visor ? "Save visor" : "Add visor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
