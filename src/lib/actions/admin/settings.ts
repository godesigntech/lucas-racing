"use server"

import { revalidatePath, updateTag } from "next/cache"

import { databaseError, failure, validationError } from "@/lib/actions/result"
import { cacheTags } from "@/lib/data/cache-tags"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { fromDeliveryMethods, fromSocialLinks } from "@/lib/supabase/mappers"
import { createClient } from "@/lib/supabase/server"
import {
  adminEmailSchema,
  businessSchema,
  deliveryMethodsSchema,
  socialLinksSchema,
  staffRoles,
  type AdminEmailValues,
  type BusinessValues,
  type DeliveryMethodsValues,
  type SocialLinksValues,
} from "@/lib/validations/admin"
import type { ActionResult, StaffRole } from "@/types/account"
import type { SocialIconName } from "@/types/settings"

import { getFullAdmin, NOT_ALLOWED } from "./guard"

const socialLabels: Record<SocialIconName, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
}

const roleNames: Record<StaffRole, string> = { admin: "an admin", sales: "sales", teamwear: "Teamwear" }

function refreshSettings() {
  updateTag(cacheTags.settings)
  revalidatePath("/admin/settings")
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

export async function updateBusinessDetails(values: BusinessValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = businessSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const data = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from("site_settings")
    .update({
      business_name: data.businessName,
      partner_name: data.partnerName,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      location: data.location,
      address_note: data.addressNote,
      opening_hours: data.openingHours,
      event_name: data.eventName,
      event_dates: data.eventDates,
      show_event_banner: data.showEventBanner,
    })
    .eq("id", 1)
  if (error) return databaseError(error, "We couldn't save the settings.")
  refreshSettings()
  return { ok: true, message: "Business details saved." }
}

export async function updateSocialLinks(values: SocialLinksValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = socialLinksSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase
    .from("site_settings")
    .update({
      social_links: fromSocialLinks(
        parsed.data.links.map((link) => ({ ...link, label: socialLabels[link.icon] })),
      ),
    })
    .eq("id", 1)
  if (error) return databaseError(error, "We couldn't save the social links.")
  refreshSettings()
  return { ok: true, message: "Social links saved." }
}

export async function updateDeliveryMethods(values: DeliveryMethodsValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const parsed = deliveryMethodsSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  if (!parsed.data.methods.some((method) => method.active)) {
    return failure("Keep at least one delivery option switched on so customers can check out.")
  }

  // New rows get an id from their name; existing ids never change, so past orders stay linked.
  const used = new Set<string>()
  const methods = parsed.data.methods.map((method) => {
    let id = method.id || slugify(method.label) || "delivery"
    while (used.has(id)) id = `${id}-2`
    used.add(id)
    return { ...method, id }
  })

  const supabase = await createClient()
  const { error } = await supabase
    .from("site_settings")
    .update({ delivery_methods: fromDeliveryMethods(methods) })
    .eq("id", 1)
  if (error) return databaseError(error, "We couldn't save the delivery options.")
  refreshSettings()
  return { ok: true, message: "Delivery options saved." }
}

export async function addAdmin(values: AdminEmailValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getFullAdmin()
  if (!admin) return NOT_ALLOWED
  const parsed = adminEmailSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)

  const supabase = await createClient()
  const { email, role } = parsed.data
  const { error } = await supabase.from("admin_users").insert({ email, role, created_by: admin.id })
  if (error) {
    if (error.code === "23505") return failure("That email already has access.")
    return databaseError(error, "We couldn't add that person.")
  }
  revalidatePath("/admin/settings")
  return { ok: true, message: `${email} can now use the admin panel as ${roleNames[role]}.` }
}

/** Change a team member's role (Admin, Sales or Teamwear). */
export async function setAdminRole(email: string, role: StaffRole): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getFullAdmin()
  if (!admin) return NOT_ALLOWED
  if (!staffRoles.includes(role)) return failure("Unknown role.")
  if (email.toLowerCase() === admin.email.toLowerCase()) return failure("You can't change your own role.")

  const supabase = await createClient()
  const { error } = await supabase.from("admin_users").update({ role }).eq("email", email.toLowerCase())
  if (error) return databaseError(error, "We couldn't change that role.")
  revalidatePath("/admin/settings")
  return { ok: true, message: `${email} is now ${roleNames[role]}.` }
}

export async function removeAdmin(email: string): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const admin = await getFullAdmin()
  if (!admin) return NOT_ALLOWED
  if (email.toLowerCase() === admin.email.toLowerCase()) return failure("You can't remove your own admin access.")

  const supabase = await createClient()
  const { error } = await supabase.from("admin_users").delete().eq("email", email.toLowerCase())
  if (error) return databaseError(error, "We couldn't remove that admin.")
  revalidatePath("/admin/settings")
  return { ok: true, message: `${email} no longer has admin access.` }
}

/** Makes MS Kart parts by HydroKarts public once the client approves the branding (off: admins only). */
export async function setKartPartsLive(live: boolean): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  const supabase = await createClient()
  const { error } = await supabase.from("site_settings").update({ kart_parts_live: live === true }).eq("id", 1)
  if (error) return databaseError(error, "We couldn't change that.")
  refreshSettings()
  revalidatePath("/customisation/kart-parts")
  return { ok: true, message: live ? "MS Kart parts by HydroKarts is now public." : "MS Kart parts by HydroKarts is now admin-only." }
}

/** Turns the News or Gallery section on or off (off: a coming-soon page until there's content). */
export async function setSectionVisible(section: "news" | "gallery", visible: boolean): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  if (!(await getFullAdmin())) return NOT_ALLOWED
  if (section !== "news" && section !== "gallery") return failure("Unknown section.")
  const supabase = await createClient()
  const { error } = await supabase
    .from("site_settings")
    .update(section === "news" ? { show_news: visible === true } : { show_gallery: visible === true })
    .eq("id", 1)
  if (error) return databaseError(error, "We couldn't change that.")
  refreshSettings()
  revalidatePath(section === "news" ? "/news" : "/gallery")
  revalidatePath("/")
  const name = section === "news" ? "News and results" : "The gallery"
  return { ok: true, message: visible ? `${name} is now on the website.` : `${name} now shows a coming-soon page.` }
}
