import { FlaskConical } from "lucide-react"

import { isDemoMode } from "@/lib/demo/mode"

/** Small fixed badge reminding everyone that demo mode shows sample data and saves nothing. */
export function DemoBanner() {
  if (!isDemoMode()) return null
  return (
    <div
      role="status"
      title="Sample data, Supabase disconnected, nothing is saved."
      className="pointer-events-none fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full bg-carbon/90 px-3 py-1.5 text-[0.7rem] text-paper shadow-lg ring-1 ring-brand/40 backdrop-blur"
    >
      <FlaskConical className="size-3 shrink-0 text-brand" aria-hidden />
      <span>
        <strong className="font-semibold">Demo mode</strong> · sample data, nothing is saved
      </span>
    </div>
  )
}
