"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { Brush, Eraser, Loader2, RotateCcw, ScanSearch, Square, Undo2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { saveShopPartPreview } from "@/lib/actions/admin/shop"
import { getSurface, loadImage, previewSize, readPixels, surfaceFinish } from "@/lib/part-preview/load"
import { buildSurface, findPartMask, maskFromPixels, renderFinish, type Pixels, type Surface } from "@/lib/part-preview/surface"
import { DEFAULT_PREVIEW_DETAIL } from "@/lib/shop/mappers"
import { finishChoices, type PartFinish } from "@/lib/shop/part-finish"
import { uploadProductMask } from "@/lib/shop/product-image"
import { cn } from "@/lib/utils"
import type { PriceBook } from "@/types/catalog"
import type { ShopProduct } from "@/types/shop"

type Tool = "add" | "erase"
type TestKind = "paint" | "film" | "chrome"

const HIGHLIGHT = [249, 83, 18]
const MAX_UNDO = 15

/**
 * Admin editor for a part's live preview: pick the photo, mark the area that gets the
 * finish (found automatically, then brushed in or out), set how much detail shows
 * through and the film size, and try paint, film and chrome before saving.
 */
export function PartPreviewEditor({ product, priceBook }: { product: ShopProduct; priceBook: PriceBook }) {
  const saved = product.customPreview
  const { colours, films } = finishChoices(priceBook)
  const sampleFilms = films.slice(0, 8)

  const [image, setImage] = useState(saved?.image ?? product.images[0] ?? "")
  const [detail, setDetail] = useState(saved?.detail ?? DEFAULT_PREVIEW_DETAIL)
  const [filmScale, setFilmScale] = useState(saved?.filmScale ?? 1)
  const [tool, setTool] = useState<Tool>("erase")
  const [brush, setBrush] = useState(28)
  const [test, setTest] = useState<{ kind: TestKind; value: string }>({ kind: "paint", value: colours[2]?.value ?? colours[0]?.value ?? "#d7261e" })
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading")
  const [maskVersion, setMaskVersion] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [saving, startSaving] = useTransition()

  const photo = useRef<Pixels | null>(null)
  const mask = useRef<Uint8Array | null>(null)
  const history = useRef<Uint8Array[]>([])
  const surface = useRef<{ version: number; value: Surface } | null>(null)
  const editCanvas = useRef<HTMLCanvasElement>(null)
  const testCanvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef<{ x: number; y: number } | null>(null)
  const frame = useRef(0)

  /** The photo with the finished area tinted orange. */
  const drawOverlay = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const canvas = editCanvas.current
      const pixels = photo.current
      const values = mask.current
      if (!canvas || !pixels || !values) return
      canvas.width = pixels.width
      canvas.height = pixels.height
      const out = new Uint8ClampedArray(pixels.data)
      for (let i = 0; i < values.length; i += 1) {
        const a = (values[i] / 255) * 0.55
        if (a === 0) continue
        for (let c = 0; c < 3; c += 1) out[i * 4 + c] = out[i * 4 + c] * (1 - a) + HIGHLIGHT[c] * a
      }
      canvas.getContext("2d")?.putImageData(new ImageData(out, pixels.width, pixels.height), 0, 0)
    })
  }, [])

  // Load the chosen photo and its saved mask (or find the outline).
  useEffect(() => {
    if (!image) return
    let cancelled = false
    void (async () => {
      try {
        const loaded = await loadImage(image)
        const { width, height } = previewSize(loaded)
        const pixels = readPixels(loaded, width, height)
        const savedMask = saved?.image === image && saved.mask ? maskFromPixels(readPixels(await loadImage(saved.mask), width, height)) : null
        if (cancelled) return
        photo.current = pixels
        mask.current = savedMask ?? findPartMask(pixels)
        history.current = []
        setDirty(saved?.image !== image)
        setStatus("ready")
        setMaskVersion((version) => version + 1)
        drawOverlay()
      } catch {
        if (!cancelled) setStatus("failed")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [image, saved?.image, saved?.mask, drawOverlay])

  // Try the chosen test finish on the current mask.
  useEffect(() => {
    if (status !== "ready" || !photo.current || !mask.current) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      if (!photo.current || !mask.current) return
      if (surface.current?.version !== maskVersion) surface.current = { version: maskVersion, value: buildSurface(photo.current, mask.current) }
      const current = surface.current.value
      const finish: Pick<PartFinish, "type" | "value"> = { type: test.kind, value: test.kind === "chrome" ? "chrome" : test.value }
      const drawn = await surfaceFinish(current, finish, priceBook, filmScale)
      const canvas = testCanvas.current
      if (cancelled || !drawn || !canvas) return
      canvas.width = current.width
      canvas.height = current.height
      const pixels = renderFinish(current, drawn, test.kind === "chrome" ? "" : "gloss", detail)
      canvas.getContext("2d")?.putImageData(new ImageData(new Uint8ClampedArray(pixels), current.width, current.height), 0, 0)
    }, 120)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [status, maskVersion, detail, filmScale, test, priceBook])

  function changeMask(next: Uint8Array) {
    if (mask.current) history.current = [...history.current.slice(-(MAX_UNDO - 1)), mask.current.slice()]
    mask.current = next
    setDirty(true)
    setMaskVersion((version) => version + 1)
    drawOverlay()
  }

  function undo() {
    const previous = history.current.pop()
    if (!previous) return
    mask.current = previous
    setDirty(true)
    setMaskVersion((version) => version + 1)
    drawOverlay()
  }

  /** Canvas pixel under the pointer. */
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const pixels = photo.current!
    return { x: ((event.clientX - rect.left) / rect.width) * pixels.width, y: ((event.clientY - rect.top) / rect.height) * pixels.height }
  }

  /** Paints the brush along a line, in or out of the finished area. */
  function stroke(from: { x: number; y: number }, to: { x: number; y: number }) {
    const pixels = photo.current
    const values = mask.current
    if (!pixels || !values) return
    const scale = pixels.width / (editCanvas.current?.getBoundingClientRect().width || pixels.width)
    const radius = (brush / 2) * scale
    const value = tool === "add" ? 255 : 0
    const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, radius / 3)))
    for (let step = 0; step <= steps; step += 1) {
      const cx = from.x + ((to.x - from.x) * step) / steps
      const cy = from.y + ((to.y - from.y) * step) / steps
      const x0 = Math.max(0, Math.floor(cx - radius))
      const x1 = Math.min(pixels.width - 1, Math.ceil(cx + radius))
      const y0 = Math.max(0, Math.floor(cy - radius))
      const y1 = Math.min(pixels.height - 1, Math.ceil(cy + radius))
      for (let y = y0; y <= y1; y += 1)
        for (let x = x0; x <= x1; x += 1) if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) values[y * pixels.width + x] = value
    }
    drawOverlay()
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!mask.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    history.current = [...history.current.slice(-(MAX_UNDO - 1)), mask.current.slice()]
    const at = point(event)
    drawing.current = at
    stroke(at, at)
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const at = point(event)
    stroke(drawing.current, at)
    drawing.current = at
  }

  function onPointerUp() {
    if (!drawing.current) return
    drawing.current = null
    setDirty(true)
    setMaskVersion((version) => version + 1)
  }

  function save() {
    const pixels = photo.current
    const values = mask.current
    if (!pixels || !values) return
    startSaving(async () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = pixels.width
        canvas.height = pixels.height
        const rgba = new Uint8ClampedArray(values.length * 4)
        for (let i = 0; i < values.length; i += 1) {
          rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 255
          rgba[i * 4 + 3] = values[i]
        }
        canvas.getContext("2d")?.putImageData(new ImageData(rgba, pixels.width, pixels.height), 0, 0)
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Couldn't save the mask."))), "image/png"))
        const maskUrl = await uploadProductMask(product.id, blob)
        const result = await saveShopPartPreview(product.id, { image, mask: maskUrl, detail, filmScale })
        if (!result.ok) throw new Error(result.message)
        // Customers' previews read the new mask; warm it so this page matches straight away.
        void getSurface({ image, mask: maskUrl })
        setDirty(false)
        toast.success(result.message)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "We couldn't save the preview.")
      }
    })
  }

  function resetToAutomatic() {
    startSaving(async () => {
      const result = await saveShopPartPreview(product.id, null)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      if (photo.current) changeMask(findPartMask(photo.current))
      setDetail(DEFAULT_PREVIEW_DETAIL)
      setFilmScale(1)
      setDirty(false)
      toast.success(result.message)
    })
  }

  if (product.images.length === 0) {
    return <p className="rounded-xl bg-carbon/5 p-4 text-sm text-muted-foreground">Add a photo of the part first (Photos, on the right).</p>
  }

  return (
    <div className="space-y-5">
      {product.images.length > 1 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Photo to customise</legend>
          <div className="flex flex-wrap gap-2">
            {product.images.map((url, index) => (
              <button
                key={url}
                type="button"
                aria-pressed={image === url}
                aria-label={`Photo ${index + 1}`}
                onClick={() => {
                  setStatus("loading")
                  setImage(url)
                }}
                className={cn("size-16 overflow-hidden rounded-xl border bg-white", image === url ? "border-carbon ring-2 ring-carbon" : "border-carbon/15 hover:border-carbon/40")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                <img src={url} alt="" className="size-full object-contain p-1" />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Finished area</p>
            <p className="text-xs text-muted-foreground">Orange is finished. Brush out bare metal (shafts, bearings, threads) or brush in anything missed.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Brush" className="flex gap-1 rounded-xl bg-carbon/5 p-1">
              {([
                { value: "erase", label: "Leave bare", icon: Eraser },
                { value: "add", label: "Finish", icon: Brush },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={tool === value}
                  onClick={() => setTool(value)}
                  className={cn("flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium", tool === value ? "bg-card shadow-sm ring-1 ring-carbon/10" : "text-muted-foreground hover:text-carbon")}
                >
                  <Icon className="size-3.5" aria-hidden /> {label}
                </button>
              ))}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={undo} disabled={status !== "ready"}>
              <Undo2 /> Undo
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => photo.current && changeMask(findPartMask(photo.current))} disabled={status !== "ready"}>
              <ScanSearch /> Find outline
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => mask.current && changeMask(new Uint8Array(mask.current.length))} disabled={status !== "ready"}>
              <Square /> Clear
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="brush-size" className="shrink-0 text-xs">
              Brush size
            </Label>
            <input id="brush-size" type="range" min={6} max={120} value={brush} onChange={(event) => setBrush(Number(event.target.value))} className="w-full accent-brand" />
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-carbon/10 bg-white">
            {status === "loading" && (
              <div className="grid h-80 place-items-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin" aria-hidden />
                <span className="sr-only">Loading the photo</span>
              </div>
            )}
            {status === "failed" && <p className="p-6 text-sm text-destructive">This photo can&apos;t be edited here. Try uploading it again as a JPG, PNG or WebP.</p>}
            <canvas
              ref={editCanvas}
              aria-label="Photo with the finished area in orange. Drag to brush."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={cn("mx-auto block h-auto max-h-[34rem] w-auto max-w-full touch-none", tool === "add" ? "cursor-crosshair" : "cursor-cell", status !== "ready" && "hidden")}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Try a finish</p>
            <p className="text-xs text-muted-foreground">Just for checking here. Customers choose from the full colour and film library.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {colours.slice(0, 8).map((colour) => (
              <button
                key={colour.value}
                type="button"
                title={colour.label}
                aria-label={colour.label}
                aria-pressed={test.kind === "paint" && test.value === colour.value}
                onClick={() => setTest({ kind: "paint", value: colour.value })}
                className={cn("size-8 rounded-full border border-carbon/15", test.kind === "paint" && test.value === colour.value && "ring-2 ring-carbon ring-offset-2")}
                style={{ background: colour.value }}
              />
            ))}
            {sampleFilms.map((film) => (
              <button
                key={film.id}
                type="button"
                title={film.name}
                aria-label={`Film ${film.name}`}
                aria-pressed={test.kind === "film" && test.value === film.id}
                onClick={() => setTest({ kind: "film", value: film.id })}
                className={cn("size-8 overflow-hidden rounded-full border border-carbon/15 bg-cover bg-center", test.kind === "film" && test.value === film.id && "ring-2 ring-carbon ring-offset-2")}
                style={{ backgroundImage: `url(${film.thumbUrl ?? film.textureUrl})` }}
              />
            ))}
            <button
              type="button"
              aria-pressed={test.kind === "chrome"}
              onClick={() => setTest({ kind: "chrome", value: "chrome" })}
              className={cn("h-8 rounded-full border border-carbon/15 bg-gradient-to-b from-white via-zinc-400 to-zinc-700 px-3 text-xs font-semibold text-carbon", test.kind === "chrome" && "ring-2 ring-carbon ring-offset-2")}
            >
              Chrome
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="preview-detail" className="text-xs">
                Detail showing through: {Math.round(detail * 100)}%
              </Label>
              <input id="preview-detail" type="range" min={0} max={1} step={0.05} value={detail} onChange={(event) => { setDetail(Number(event.target.value)); setDirty(true) }} className="w-full accent-brand" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="preview-film" className="text-xs">
                Film pattern size: {filmScale.toFixed(2)}×
              </Label>
              <input id="preview-film" type="range" min={0.25} max={4} step={0.05} value={filmScale} onChange={(event) => { setFilmScale(Number(event.target.value)); setDirty(true) }} className="w-full accent-brand" />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-carbon/10 bg-white">
            <canvas ref={testCanvas} aria-label="Test preview" className={cn("mx-auto block h-auto max-h-[34rem] w-auto max-w-full", status !== "ready" && "hidden")} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-carbon/10 pt-4">
        <Button type="button" onClick={save} disabled={saving || status !== "ready" || !dirty}>
          {saving && <Loader2 className="animate-spin" aria-hidden />} Save preview
        </Button>
        {saved && (
          <Button type="button" variant="outline" onClick={resetToAutomatic} disabled={saving}>
            <RotateCcw /> Reset to automatic
          </Button>
        )}
        <p className="text-xs text-muted-foreground">{dirty ? "Unsaved changes." : saved ? "Saved. Customers see this on the part's page." : "Automatic outline from the main photo."}</p>
      </div>
    </div>
  )
}
