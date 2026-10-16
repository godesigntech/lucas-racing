import "server-only"

import { siteConfig } from "@/config/site"

export interface EmailMessage {
  to: string | string[]
  subject: string
  html: string
  text: string
  /** Where replies go, e.g. the customer for workshop alerts. */
  replyTo?: string
}

/** Absolute site address for links in emails. */
export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/$/, "")
  return `${base}${path}`
}

/** Escapes user-supplied text before it goes into an email's HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!)
}

/**
 * Sends an email through Resend (https://resend.com). Until RESEND_API_KEY and
 * EMAIL_FROM are set it does nothing, so the site works without email.
 * Never throws: an email failing must not undo an order or message.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") console.info(`[email skipped, no RESEND_API_KEY] ${message.subject}`)
    return false
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo,
      }),
    })
    if (!response.ok) {
      console.error("Email failed:", response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error("Email failed:", error)
    return false
  }
}

/** Shared branded layout for every email. `body` must already be escaped HTML. */
export function emailLayout({ heading, body, action }: { heading: string; body: string; action?: { label: string; href: string } }) {
  const button = action
    ? `<p style="margin:28px 0 0"><a href="${action.href}" style="display:inline-block;background:#f95312;color:#111412;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px">${escapeHtml(action.label)}</a></p>`
    : ""
  return `<!doctype html>
<html><body style="margin:0;background:#f4f3ee;font-family:Arial,Helvetica,sans-serif;color:#111412">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#ffffff;padding:20px 28px;border-bottom:4px solid #f95312"><img src="${siteUrl()}/images/brand/lucas-racing-logo.png" width="140" height="57" alt="Lucas Racing" style="display:block;border:0"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(heading)}</h1>
<div style="font-size:15px;line-height:1.6">${body}</div>
${button}
</td></tr>
<tr><td style="padding:16px 28px;background:#f4f3ee;font-size:12px;color:#5c635d">Lucas Racing · <a href="${siteUrl()}" style="color:#5c635d">${escapeHtml(siteUrl().replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`
}
