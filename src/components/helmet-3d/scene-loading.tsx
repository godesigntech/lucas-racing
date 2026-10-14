import { Loader2 } from "lucide-react"

/** "Loading 3D helmet" box with a progress bar, centred over the viewer. */
export function SceneLoading({ progress }: { progress?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status">
      <div className="flex w-44 flex-col items-center gap-2 rounded-2xl bg-card/90 px-4 py-3 text-xs font-medium shadow-sm ring-1 ring-carbon/10">
        <span className="flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" aria-hidden /> Loading 3D helmet
        </span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-carbon/10">
          <span
            className="block h-full rounded-full bg-lime-ink transition-[width]"
            style={{ width: `${Math.max(5, Math.round(progress ?? 5))}%` }}
          />
        </span>
      </div>
    </div>
  )
}
