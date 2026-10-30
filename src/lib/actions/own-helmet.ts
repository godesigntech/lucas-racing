"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { getCurrentUser } from "@/lib/auth/session"
import { getPriceBook } from "@/lib/data/products"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyNewQuote } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import {
  ownHelmetFinishLabels,
  ownHelmetLacquerLabels,
  ownHelmetSchema,
  type OwnHelmetValues,
} from "@/lib/validations/own-helmet"
import type { ActionResult } from "@/types/account"

import { databaseError, failure, validationError } from "./result"

/**
 * "Send my own helmet": saves the customer's contact details to their profile (a
 * helmet request needs a complete one), then submits their photos and choices as
 * a quote request. submit_own_helmet_request() re-checks the profile, the photos
 * and the logos in the database.
 */
export async function submitOwnHelmetRequest(values: OwnHelmetValues): Promise<ActionResult<{ reference: string }>> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const user = await getCurrentUser()
  if (!user) return failure("Please log in to send your request.")

  const parsed = ownHelmetSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const request = parsed.data

  // Only films the workshop actually offers, recorded by id and name.
  const priceBook = await getPriceBook()
  const films = request.films
    .map((id) => priceBook.films.find((film) => film.id === id))
    .filter((film): film is NonNullable<typeof film> => Boolean(film))
    .map((film) => ({ id: film.id, name: film.name, code: film.code }))

  const supabase = await createClient()
  const { address } = request
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: request.name,
      phone: request.phone,
      address_line1: address.line1,
      address_line2: address.line2,
      city: address.city,
      county: address.county,
      postcode: address.postcode,
      country: address.country || "United Kingdom",
    })
    .eq("id", user.id)
  if (profileError) return databaseError(profileError, "We couldn't save your details. Please try again.")

  const details = {
    makeModel: request.makeModel,
    size: request.size,
    finishes: request.finishes,
    lacquer: request.lacquer,
    films,
    racingName: request.racingName,
    racingNumber: request.racingNumber,
    extraText: request.extraText,
    logos: request.logos,
  }
  const { data, error } = await supabase.rpc("submit_own_helmet_request", {
    p_notes: request.notes,
    p_photo_paths: request.photos,
    p_details: details,
  })
  if (error) return databaseError(error, "We couldn't send your request. Please try again.")
  const reference = data?.[0]?.reference
  if (!reference) return failure("We couldn't send your request. Please try again.")

  const choices = [
    `Helmet: ${request.makeModel}${request.size ? ` (size ${request.size})` : ""}`,
    request.finishes.length ? `Paint: ${request.finishes.map((finish) => ownHelmetFinishLabels[finish]).join(", ")}` : "",
    `Lacquer: ${ownHelmetLacquerLabels[request.lacquer]}`,
    films.length ? `Films: ${films.map((film) => film.name).join(", ")}` : "",
    `${request.photos.length} photo(s), ${request.logos.length} logo(s). Full details in Admin > Quotes.`,
  ]
  after(() =>
    notifyNewQuote({
      reference,
      name: request.name,
      email: user.email,
      phone: request.phone,
      helmet: `Own helmet: ${request.makeModel}`,
      notes: request.notes,
      summary: choices.filter(Boolean).join(" · "),
    }),
  )

  revalidatePath("/account/quotes")
  return { ok: true, data: { reference } }
}
