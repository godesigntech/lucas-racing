"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { toast } from "react-toastify"

import { AdminCard } from "@/components/admin/admin-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { applyProductImport, finishProductImport, previewProductImport } from "@/lib/actions/admin/shop-import"
import { formatMoney } from "@/lib/format"
import { buildProducts, chunks, fields, guessMapping, type FieldKey, type Mapping } from "@/lib/shop/csv-import"
import { cn } from "@/lib/utils"
import {
  IMPORT_BATCH,
  importStores,
  type ImportCounts,
  type ImportOptions,
  type ImportProduct,
  type ImportRowError,
  type ImportStoreId,
} from "@/lib/validations/shop-import"

import { storeLabels } from "./store-labels"

const MAX_ROWS = 20000
const NONE = "__none"

const addCounts = (a: ImportCounts, b: ImportCounts): ImportCounts => ({
  created: a.created + b.created,
  updated: a.updated + b.updated,
  unchanged: a.unchanged + b.unchanged,
  failed: a.failed + b.failed,
})
const zero: ImportCounts = { created: 0, updated: 0, unchanged: 0, failed: 0 }

const TEMPLATE = [
  "Part number,Name,Price,Brand,Category,Subcategory,Description,Image links,Group,Size,Stock",
  'MS-1001,MS Kart Fireball chassis,3495.00,MS Kart,Complete karts,,"Race-ready OK-N chassis",https://example.com/fireball.jpg,,,1',
  "MS-2001-S,Lucas Racing race gloves,39.99,Lucas Racing,Clothing,Gloves,Lightweight race gloves,,MS-2001,S,4",
  "MS-2001-M,Lucas Racing race gloves,39.99,Lucas Racing,Clothing,Gloves,Lightweight race gloves,,MS-2001,M,6",
].join("\n")

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "product-import-template.csv"
  link.click()
  URL.revokeObjectURL(url)
}

type Stage = "idle" | "checking" | "checked" | "importing" | "done"

export function ProductImport() {
  const router = useRouter()
  const [storeId, setStoreId] = useState<ImportStoreId>("ms-kart")
  const [file, setFile] = useState<{ name: string; headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [mapping, setMapping] = useState<Mapping>({})
  const [optionName, setOptionName] = useState("")
  const [createCategories, setCreateCategories] = useState(true)
  const [publishNew, setPublishNew] = useState(false)
  const [fullCatalogue, setFullCatalogue] = useState(false)
  const [stage, setStage] = useState<Stage>("idle")
  const [progress, setProgress] = useState(0)
  const [built, setBuilt] = useState<{ products: ImportProduct[]; errors: ImportRowError[] } | null>(null)
  const [counts, setCounts] = useState<ImportCounts>(zero)
  const [result, setResult] = useState<{ counts: ImportCounts; errors: ImportRowError[]; hidden: number } | null>(null)

  const busy = stage === "checking" || stage === "importing"
  const options: ImportOptions = { storeId, optionName: optionName.trim(), createCategories, publishNew }

  /** Any change to the file or settings means the check has to run again. */
  function invalidate() {
    if (stage !== "idle") setStage("idle")
    setBuilt(null)
    setResult(null)
  }

  function onFile(selected: File | undefined) {
    invalidate()
    if (!selected) return
    Papa.parse<Record<string, string>>(selected, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (parsed) => {
        const headers = (parsed.meta.fields ?? []).filter((header) => header.trim())
        if (headers.length === 0 || parsed.data.length === 0) {
          toast.error("That file has no rows. Check it's a CSV file with a header row.")
          setFile(null)
          return
        }
        if (parsed.data.length > MAX_ROWS) {
          toast.error(`That file has more than ${MAX_ROWS.toLocaleString()} rows. Split it into smaller files.`)
          setFile(null)
          return
        }
        const guessed = guessMapping(headers)
        setFile({ name: selected.name, headers, rows: parsed.data })
        setMapping(guessed)
        setOptionName(guessed.optionValue ?? "")
      },
      error: () => toast.error("That file couldn't be read. Save it as CSV (comma separated) and try again."),
    })
  }

  function setField(key: FieldKey, header: string) {
    invalidate()
    setMapping((current) => ({ ...current, [key]: header === NONE ? undefined : header }))
    if (key === "optionValue" && header !== NONE && !optionName) setOptionName(header)
  }

  async function check() {
    if (!file) return
    const missing = fields.filter((field) => field.required && !mapping[field.key])
    if (missing.length) {
      toast.error(`Choose a column for ${missing.map((field) => field.label.toLowerCase()).join(", ")}.`)
      return
    }
    const next = buildProducts(file.rows, mapping, options.optionName)
    setBuilt(next)
    setCounts(zero)
    if (next.products.length === 0) {
      setStage("checked")
      return
    }
    setStage("checking")
    setProgress(0)
    let total = zero
    try {
      for (const [index, batch] of chunks(next.products, IMPORT_BATCH).entries()) {
        const response = await previewProductImport(options, batch)
        if (!response.ok) {
          toast.error(response.message)
          setStage("idle")
          return
        }
        total = addCounts(total, response.data?.counts ?? zero)
        setProgress(Math.min(next.products.length, (index + 1) * IMPORT_BATCH))
      }
    } catch {
      toast.error("Something went wrong. Check your connection and try again.")
      setStage("idle")
      return
    }
    setCounts(total)
    setStage("checked")
  }

  async function runImport() {
    if (!file || !built) return
    setStage("importing")
    setProgress(0)
    let total = zero
    const errors = [...built.errors]
    let complete = true
    for (const [index, batch] of chunks(built.products, IMPORT_BATCH).entries()) {
      try {
        const response = await applyProductImport(options, batch)
        if (!response.ok) throw new Error(response.message)
        total = addCounts(total, response.data?.counts ?? zero)
        errors.push(...(response.data?.errors ?? []))
      } catch (error) {
        complete = false
        total = addCounts(total, { ...zero, failed: batch.length })
        errors.push({ row: batch[0].variants[0].row, message: error instanceof Error ? error.message : "This part of the file couldn't be imported." })
      }
      setProgress(Math.min(built.products.length, (index + 1) * IMPORT_BATCH))
    }

    // Only hide missing products when every batch went through, so a dropped connection can't hide half the shop.
    const finish = await finishProductImport(options, {
      fileName: file.name,
      fullCatalogue: fullCatalogue && complete,
      seenIds: built.products.map((product) => product.externalId),
      counts: total,
      errors,
    }).catch(() => null)
    const hidden = finish?.ok ? (finish.data?.hidden ?? 0) : 0
    setResult({ counts: total, errors: errors.sort((a, b) => a.row - b.row), hidden })
    setStage("done")
    if (fullCatalogue && !complete) toast.warn("Some products couldn't be imported, so no products were hidden.")
    else toast.success("Import finished.")
    router.refresh()
  }

  function reset() {
    setFile(null)
    setBuilt(null)
    setResult(null)
    setStage("idle")
  }

  const sample = file?.rows[0]
  const totalProducts = built?.products.length ?? 0

  return (
    <div className="space-y-6">
      <AdminCard
        title="1. Choose the file"
        description="A CSV file from the supplier, with a header row. Excel can save any spreadsheet as CSV."
        action={
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download /> Example file
          </Button>
        }
      >
        <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
          <div className="grid gap-2">
            <Label htmlFor="import-store">Shop</Label>
            <Select
              value={storeId}
              onValueChange={(value) => {
                invalidate()
                setStoreId(value as ImportStoreId)
              }}
              disabled={busy}
            >
              <SelectTrigger id="import-store" className="w-full">
                <SelectValue>{storeLabels[storeId]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(importStores) as ImportStoreId[]).map((id) => (
                  <SelectItem key={id} value={id}>
                    {storeLabels[id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="import-file">CSV file</Label>
            <Input
              id="import-file"
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              onChange={(event) => onFile(event.target.files?.[0])}
              className="cursor-pointer file:mr-3 file:font-semibold"
            />
          </div>
        </div>
        {file && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="size-4 text-brand-ink" aria-hidden />
            <span className="font-medium text-foreground">{file.name}</span> · {file.rows.length.toLocaleString()} rows ·{" "}
            {file.headers.length} columns
          </p>
        )}
      </AdminCard>

      {file && (
        <AdminCard title="2. Match the columns" description="We've guessed where we can. Leave a field as “Not in file” if the supplier doesn't send it.">
          <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
            {fields.map((field) => {
              const header = mapping[field.key]
              const example = header && sample ? String(sample[header] ?? "").trim() : ""
              return (
                <div key={field.key} className="grid content-start gap-1.5">
                  <Label htmlFor={`map-${field.key}`}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Select value={header ?? NONE} onValueChange={(value) => setField(field.key, value)} disabled={busy}>
                    <SelectTrigger id={`map-${field.key}`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not in file</SelectItem>
                      {file.headers.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {example ? (
                    <p className="truncate text-xs text-muted-foreground">e.g. {example}</p>
                  ) : (
                    field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 grid gap-5 border-t border-carbon/10 pt-5 md:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <Label htmlFor="import-option-name">Option name</Label>
              <Input
                id="import-option-name"
                value={optionName}
                maxLength={30}
                placeholder="Size"
                disabled={busy}
                onChange={(event) => {
                  invalidate()
                  setOptionName(event.target.value)
                }}
              />
              <p className="text-xs text-muted-foreground">Shown to customers when a product has options, for example Size.</p>
            </div>
            <div className="grid content-start gap-3">
              <Toggle id="import-categories" label="Create categories that don't exist yet" checked={createCategories} disabled={busy} onChange={(value) => { invalidate(); setCreateCategories(value) }} />
              <Toggle id="import-publish" label="Put new products on sale straight away" hint="Off: new products start hidden so you can check them first." checked={publishNew} disabled={busy} onChange={(value) => { invalidate(); setPublishNew(value) }} />
              <Toggle id="import-full" label="This file is the full catalogue" hint="Products missing from the file are hidden (never deleted)." checked={fullCatalogue} disabled={busy} onChange={(value) => { invalidate(); setFullCatalogue(value) }} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={check} disabled={busy}>
              {stage === "checking" && <Loader2 className="animate-spin" aria-hidden />}
              Check the file
            </Button>
            {stage === "checking" && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Checking {progress.toLocaleString()} of {totalProducts.toLocaleString()} products…
              </p>
            )}
          </div>
        </AdminCard>
      )}

      {built && (stage === "checked" || stage === "importing") && (
        <AdminCard title="3. Check and import" description="Nothing has been changed yet.">
          <Stats
            items={[
              { label: "New", value: counts.created },
              { label: "Changed", value: counts.updated },
              { label: "No change", value: counts.unchanged },
              { label: "Rows with problems", value: built.errors.length, warn: built.errors.length > 0 },
            ]}
          />
          {built.products.length > 0 && <ProductSample products={built.products} />}
          <RowErrors errors={built.errors} />
          <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Stock levels of existing products are never changed. Opening stock is only used for new options.</li>
            <li>Names, descriptions, photos and prices you’ve changed by hand are kept.</li>
            <li>The supplier’s price is saved as the RRP on every option.</li>
            {!publishNew && <li>New products start hidden. Turn them on in Shop products when you’re happy with them.</li>}
            {fullCatalogue && <li>Active {storeLabels[storeId]} products that aren’t in this file will be hidden.</li>}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={runImport} disabled={busy || built.products.length === 0 || (counts.created + counts.updated === 0 && !fullCatalogue)}>
              {stage === "importing" ? <Loader2 className="animate-spin" aria-hidden /> : <Upload />}
              Import {totalProducts.toLocaleString()} {totalProducts === 1 ? "product" : "products"}
            </Button>
            {stage === "importing" && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Imported {progress.toLocaleString()} of {totalProducts.toLocaleString()}… Keep this page open.
              </p>
            )}
          </div>
        </AdminCard>
      )}

      {result && stage === "done" && (
        <AdminCard title="Import finished">
          <Stats
            items={[
              { label: "Added", value: result.counts.created },
              { label: "Updated", value: result.counts.updated },
              { label: "No change", value: result.counts.unchanged },
              { label: "Hidden", value: result.hidden },
              { label: "Problems", value: result.errors.length, warn: result.errors.length > 0 },
            ]}
          />
          <RowErrors errors={result.errors} title="These rows weren't imported" />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/admin/shop?store=${storeId}`}>View {storeLabels[storeId]} products</Link>
            </Button>
            <Button variant="outline" onClick={reset}>
              Import another file
            </Button>
          </div>
        </AdminCard>
      )}
    </div>
  )
}

function Toggle({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  )
}

function Stats({ items }: { items: { label: string; value: number; warn?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
      {items.map((item) => (
        <div key={item.label} className={cn("rounded-xl border border-carbon/10 px-4 py-3", item.warn && "border-amber-300 bg-amber-50")}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-2xl font-semibold tabular-nums">{item.value.toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  )
}

function ProductSample({ products }: { products: ImportProduct[] }) {
  const shown = products.slice(0, 8)
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-carbon/10">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Product</th>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Options</th>
            <th className="px-3 py-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-carbon/10">
          {shown.map((product) => {
            const prices = product.variants.map((variant) => variant.price)
            const low = Math.min(...prices)
            const high = Math.max(...prices)
            return (
              <tr key={product.externalId}>
                <td className="max-w-64 truncate px-3 py-2 font-medium">{product.title}</td>
                <td className="px-3 py-2 font-mono text-xs">{product.externalId}</td>
                <td className="max-w-48 truncate px-3 py-2 text-muted-foreground">{product.category || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {product.variants.length > 1 ? product.variants.map((variant) => variant.optionValue).join(", ") : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {low === high ? formatMoney(low) : `${formatMoney(low)} – ${formatMoney(high)}`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {products.length > shown.length && (
        <p className="border-t border-carbon/10 px-3 py-2 text-xs text-muted-foreground">
          and {(products.length - shown.length).toLocaleString()} more
        </p>
      )}
    </div>
  )
}

function RowErrors({ errors, title = "These rows will be skipped" }: { errors: ImportRowError[]; title?: string }) {
  if (errors.length === 0) return null
  const shown = errors.slice(0, 50)
  return (
    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
        {shown.map((error, index) => (
          <li key={`${error.row}-${index}`}>
            <span className="font-mono text-xs">Row {error.row}</span> · {error.message}
          </li>
        ))}
      </ul>
      {errors.length > shown.length && <p className="mt-2 text-xs text-muted-foreground">and {errors.length - shown.length} more</p>}
    </div>
  )
}
