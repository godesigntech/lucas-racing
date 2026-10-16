import Image from "next/image"

import { brandLogos } from "@/constants/brand"
import { cn } from "@/lib/utils"

/**
 * The supplied MS Kart and HydroKarts logos side by side with a plain "by".
 * Stands in for the combined "MS Kart by HydroKarts" logo until the client approves it.
 */
export function KartPartsBrand({ className, preload }: { className?: string; preload?: boolean }) {
  const { msKart, hydroKarts } = brandLogos
  return (
    <div className={cn("inline-flex items-center gap-4 rounded-2xl bg-paper px-5 py-3 text-carbon shadow-sm", className)}>
      <Image src={msKart.src} alt={msKart.alt} width={msKart.width} height={msKart.height} preload={preload} sizes="200px" className="h-10 w-auto sm:h-12" />
      <span className="font-display text-lg font-bold uppercase text-carbon/60">by</span>
      <Image src={hydroKarts.src} alt={hydroKarts.alt} width={hydroKarts.width} height={hydroKarts.height} preload={preload} sizes="160px" className="h-10 w-auto sm:h-12" />
    </div>
  )
}
