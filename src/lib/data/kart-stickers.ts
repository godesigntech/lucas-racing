import "server-only"

import { createHash } from "node:crypto"

import { DEFAULT_KART_DESIGNS_PER_DAY } from "@/lib/kart-stickers/options"
import { canCreateAccounts, createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { KartDesign } from "@/types/kart-stickers"

const LINK_SECONDS = 60 * 60

/** The signed-in customer's kart sticker designs (newest first), and how many more they can make today. */
export async function getMyKartStudio(userId: string): Promise<{ designs: KartDesign[]; remaining: number; limit: number }> {
  const setting = Number(process.env.KART_DESIGNS_PER_DAY)
  const limit = Number.isInteger(setting) && setting >= 1 && setting <= 50 ? setting : DEFAULT_KART_DESIGNS_PER_DAY
  const supabase = await createClient()
  const { data, error } = await supabase.from("kart_sticker_designs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30)
  if (error) throw new Error(`Could not load your designs: ${error.message}`)
  if (!canCreateAccounts) return { designs: (data ?? []).map((row) => ({ ...toDesign(row), imageUrl: null })), remaining: 0, limit }

  // Pictures and the daily limit are only readable with the secret key.
  const admin = createAdminClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const key = createHash("sha256").update(`kart:${userId}`).digest("hex")
  const [signed, used] = await Promise.all([
    data?.length ? admin.storage.from("design-uploads").createSignedUrls(data.map((row) => row.image_path), LINK_SECONDS) : Promise.resolve(null),
    admin.from("ai_usage").select("id", { count: "exact", head: true }).eq("visitor_key", key).eq("kind", "kart").gte("created_at", since),
  ])
  const urls = new Map((signed?.data ?? []).flatMap((link) => (link.path && link.signedUrl ? [[link.path, link.signedUrl] as const] : [])))
  return {
    designs: (data ?? []).map((row) => ({ ...toDesign(row), imageUrl: urls.get(row.image_path) ?? null })),
    remaining: Math.max(0, limit - (used.count ?? 0)),
    limit,
  }
}

function toDesign(row: {
  id: string
  layout: string
  kart_model: string
  prompt: string
  race_number: string
  driver_name: string
  finish: string
  logos: string[] | null
  created_at: string
}): Omit<KartDesign, "imageUrl"> {
  return {
    id: row.id,
    layout: row.layout,
    kartModel: row.kart_model,
    prompt: row.prompt,
    raceNumber: row.race_number,
    driverName: row.driver_name,
    finish: row.finish as KartDesign["finish"],
    logos: row.logos ?? [],
    createdAt: row.created_at,
  }
}
