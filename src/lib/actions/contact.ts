"use server"

import { after } from "next/server"

import { databaseError, validationError } from "@/lib/actions/result"
import { DEMO_READ_ONLY, isDemoMode } from "@/lib/demo/mode"
import { notifyNewEnquiry } from "@/lib/email/notifications"
import { createClient } from "@/lib/supabase/server"
import { contactSchema, contactTopics, type ContactFormValues } from "@/lib/validations/contact"
import type { ActionResult } from "@/types/account"

const NO_DESIGN = "none"

/** Saves a contact form message for the workshop (open to guests) and emails the team. */
export async function sendContactMessage(values: ContactFormValues): Promise<ActionResult> {
  if (isDemoMode()) return DEMO_READ_ONLY
  const parsed = contactSchema.safeParse(values)
  if (!parsed.success) return validationError(parsed.error)
  const { name, email, phone, topic, design, message } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.rpc("submit_contact_message", {
    p_name: name,
    p_email: email,
    p_phone: phone,
    p_topic: topic,
    p_design: design === NO_DESIGN ? "" : design,
    p_message: message,
  })
  if (error) return databaseError(error, "Your message couldn't be sent. Please try again, or email us directly.")

  const topicLabel = contactTopics.find((item) => item.value === topic)?.label ?? topic
  after(() => notifyNewEnquiry({ name, email, phone, topic: topicLabel, design: design === NO_DESIGN ? "" : design, message }))

  return { ok: true, message: `Thanks ${name.split(" ")[0]}, your message is with the workshop. We'll reply by email soon.` }
}
