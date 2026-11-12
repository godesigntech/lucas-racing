"use server"

import { createHash, randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { after } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { ConceptImageError } from "@/lib/design-assistant/concept-image"
import { editWithOpenAi, type ImageInput, openAiImagesConfigured } from "@/lib/design-assistant/openai"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyNewQuote } from "@/lib/email/notifications"
import { DEFAULT_KART_DESIGNS_PER_DAY, findKartLayout, isReadyLayout, kartFinishLabels, type ReadyKartLayout } from "@/lib/kart-stickers/options"
import { kartDesignPrompt } from "@/lib/kart-stickers/prompt"
import { canCreateAccounts, createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { kartDesignSchema, kartRequestSchema, type KartDesignValues } from "@/lib/validations/kart-stickers"
import type { ActionResult } from "@/types/account"
import type { KartDesign } from "@/types/kart-stickers"

import { databaseError, failure, validationError } from "./result"

const BUCKET = "design-uploads"
const LINK_SECONDS = 60 * 60

/** How many AI designs each account can make a day: KART_DESIGNS_PER_DAY, or 5. */
function designsPerDay(): number {
  const setting = Number(process.env.KART_DESIGNS_PER_DAY)
  return Number.isInteger(setting) && setting >= 1 && setting <= 50 ? setting : DEFAULT_KART_DESIGNS_PER_DAY
}

/** The limit is kept per account, as a hash so the user id isn't stored with it. */
function limitKey(userId: string): string {
  return createHash("sha256").update(`kart:${userId}`).digest("hex")
}

/** The blank layout picture: from the site's files, or fetched from the site where those aren't on disk. */
async function layoutImage(layout: ReadyKartLayout): Promise<ImageInput> {
  try {
    return { bytes: await readFile(path.join(process.cwd(), "public", layout.image)), type: "image/png", name: `${layout.id}.png` }
  } catch {
    const list = await headers()
    const origin = `${list.get("x-forwarded-proto") ?? "https"}://${list.get("host")}`
    const response = await fetch(new URL(layout.image, origin))
    if (!response.ok) throw new Error(`Couldn't load the ${layout.name} layout`)
    return { bytes: new Uint8Array(await response.arrayBuffer()), type: "image/png", name: `${layout.id}.png` }
  }
}

/** The customer's own logos, for the AI to place. */
async function logoImages(admin: ReturnType<typeof createAdminClient>, paths: string[]): Promise<ImageInput[]> {
  return Promise.all(
    paths.map(async (logo, index) => {
      const { data, error } = await admin.storage.from("design-logos").download(logo)
      if (error || !data) throw new Error("One of your logos couldn't be read. Please add it again.")
      const type = logo.endsWith(".png") ? "image/png" : logo.endsWith(".webp") ? "image/webp" : "image/jpeg"
      return { bytes: new Uint8Array(await data.arrayBuffer()), type, name: `logo-${index + 1}.${logo.split(".").pop()}` } as ImageInput
    }),
  )
}

/**
 * Paints the customer's kart sticker design onto the blank layout with AI, saves it to
 * their designs and returns it. Signed-in customers only, up to designsPerDay() a day.
 */
export async function generateKartDesign(values: KartDesignValues): Promise<ActionResult<{ design: KartDesign; remaining: number }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to design your stickers.")
  const parsed = kartDesignSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const request = parsed.data
  const layout = findKartLayout(request.layout)
  if (!layout || !isReadyLayout(layout)) return failure("That layout isn't available to design on yet. Choose one that is.")
  if (request.logos.some((logo) => !logo.startsWith(`${user.id}/`))) return failure("One of your logos isn't valid. Please add it again.")
  if (!openAiImagesConfigured() || !canCreateAccounts) return failure("AI designs aren't available right now. Please try again later.")

  const admin = createAdminClient()
  const key = limitKey(user.id)
  const limit = designsPerDay()
  const { data: allowed, error: limitError } = await admin.rpc("claim_ai_use", { p_visitor: key, p_kind: "kart", p_limit: limit, p_window_minutes: 1440 })
  if (limitError) return databaseError(limitError, "We couldn't start your design. Please try again.")
  if (!allowed) return failure(`You've made ${limit} designs today. Come back tomorrow for more, or send one of your designs for a quote.`)

  try {
    const [blank, logos] = await Promise.all([layoutImage(layout), logoImages(admin, request.logos)])
    const image = await editWithOpenAi(kartDesignPrompt(layout, request), [blank, ...logos])

    const imagePath = `kart/${user.id}/${randomUUID()}.jpg`
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(imagePath, Buffer.from(image, "base64"), { contentType: "image/jpeg" })
    if (uploadError) throw new Error(uploadError.message)
    const { data: row, error: insertError } = await admin
      .from("kart_sticker_designs")
      .insert({
        user_id: user.id,
        layout: layout.id,
        kart_model: request.kartModel,
        prompt: request.prompt,
        race_number: request.raceNumber,
        driver_name: request.driverName,
        finish: request.finish,
        logos: request.logos,
        image_path: imagePath,
      })
      .select("*")
      .single()
    if (insertError || !row) throw new Error(insertError?.message ?? "The design couldn't be saved")

    const { data: link } = await admin.storage.from(BUCKET).createSignedUrl(imagePath, LINK_SECONDS)
    const remaining = await remainingToday(admin, key, limit)
    revalidatePath("/kart-stickers")
    return { ok: true, data: { design: toKartDesign(row, link?.signedUrl ?? null), remaining } }
  } catch (error) {
    console.error("Kart sticker design failed:", error instanceof Error ? error.message : error)
    // Nothing was made, so give the attempt back.
    await admin.rpc("release_ai_use", { p_visitor: key, p_kind: "kart" })
    const reason = error instanceof ConceptImageError ? error.reason : "failed"
    if (reason === "quota") return failure("AI designs are busy right now. Please try again a little later.")
    if (reason === "flagged") return failure("The AI couldn't draw that design. Try describing it differently.")
    return failure(error instanceof Error && error.message.startsWith("One of your logos") ? error.message : "The AI couldn't finish your design. Please try again.")
  }
}

async function remainingToday(admin: ReturnType<typeof createAdminClient>, key: string, limit: number): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await admin.from("ai_usage").select("id", { count: "exact", head: true }).eq("visitor_key", key).eq("kind", "kart").gte("created_at", since)
  return Math.max(0, limit - (count ?? 0))
}

/** Sends one of the customer's designs to the workshop for a quote. */
export async function submitKartStickerRequest(values: { designId: string; notes: string }): Promise<ActionResult<{ reference: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to send your design.")
  const parsed = kartRequestSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("submit_kart_sticker_request", { p_design: parsed.data.designId, p_notes: parsed.data.notes })
  if (error) return databaseError(error, "We couldn't send your design. Please try again.")
  const reference = data?.[0]?.reference
  if (!reference) return failure("We couldn't send your design. Please try again.")

  const { data: design } = await supabase.from("kart_sticker_designs").select("*").eq("id", parsed.data.designId).maybeSingle()
  after(() =>
    notifyNewQuote({
      reference,
      name: user.fullName || user.email,
      email: user.email,
      phone: "",
      helmet: "Kart stickers",
      notes: parsed.data.notes,
      summary: design
        ? [
            `Kart: ${design.kart_model} (${findKartLayout(design.layout)?.name ?? design.layout} layout)`,
            `Finish: ${kartFinishLabels[design.finish as keyof typeof kartFinishLabels]?.label ?? design.finish}`,
            design.race_number ? `Number: ${design.race_number}` : "",
            design.driver_name ? `Name: ${design.driver_name}` : "",
            `Brief: ${design.prompt}`,
            "Design and logos in Admin > Quotes.",
          ]
            .filter(Boolean)
            .join(" · ")
        : "Design in Admin > Quotes.",
    }),
  )
  revalidatePath("/account/quotes")
  return { ok: true, message: `Sent! Your reference is ${reference}. We'll come back to you with a quote.`, data: { reference } }
}

/** Deletes one of the customer's designs and its picture. Designs already sent stay with the request. */
export async function deleteKartDesign(id: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in.")
  const supabase = await createClient()
  const { data: design } = await supabase.from("kart_sticker_designs").select("id, image_path").eq("id", id).eq("user_id", user.id).maybeSingle()
  if (!design) return failure("That design no longer exists.")
  const { error } = await supabase.from("kart_sticker_designs").delete().eq("id", id)
  if (error) return databaseError(error, "We couldn't delete that design.")
  // A design sent for a quote keeps its picture for the workshop.
  if (canCreateAccounts) {
    const admin = createAdminClient()
    const { count } = await admin.from("quote_requests").select("id", { count: "exact", head: true }).eq("image_path", design.image_path)
    if (!count) await admin.storage.from(BUCKET).remove([design.image_path])
  }
  revalidatePath("/kart-stickers")
  return { ok: true, message: "Design deleted." }
}

/** A saved design as the page shows it. */
function toKartDesign(row: KartStickerDesignRowLike, imageUrl: string | null): KartDesign {
  return {
    id: row.id,
    layout: row.layout,
    kartModel: row.kart_model,
    prompt: row.prompt,
    raceNumber: row.race_number,
    driverName: row.driver_name,
    finish: row.finish as KartDesign["finish"],
    logos: row.logos ?? [],
    imageUrl,
    createdAt: row.created_at,
  }
}

type KartStickerDesignRowLike = {
  id: string
  layout: string
  kart_model: string
  prompt: string
  race_number: string
  driver_name: string
  finish: string
  logos: string[] | null
  created_at: string
}
