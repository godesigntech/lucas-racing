import "server-only"

import nodemailer, { type Transporter } from "nodemailer"

import { siteConfig } from "@/config/site"

import { brandedEmail, escapeHtml } from "./layout"

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

export { escapeHtml }

let smtpTransport: Transporter | undefined

/** The mailbox's own SMTP server (Fasthosts: smtp.livemail.co.uk, port 465), when set. */
function smtp(): Transporter | undefined {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASSWORD: pass } = process.env
  if (!host || !user || !pass) return undefined
  const port = Number(process.env.SMTP_PORT) || 465
  smtpTransport ??= nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  return smtpTransport
}

/**
 * Sends an email through the mailbox's SMTP server when SMTP_HOST, SMTP_USER and
 * SMTP_PASSWORD are set, otherwise through Resend (https://resend.com). With neither
 * (or no EMAIL_FROM) it does nothing, so the site works without email.
 * Never throws: an email failing must not undo an order or message.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const transport = smtp()
  // Mail hosts like Fasthosts only accept mail from the mailbox that logs in.
  const from = process.env.EMAIL_FROM || (transport ? `Lucas Racing <${process.env.SMTP_USER}>` : undefined)
  if (transport && from) {
    try {
      await transport.sendMail({ from, to: message.to, subject: message.subject, html: message.html, text: message.text, replyTo: message.replyTo })
      return true
    } catch (error) {
      console.error("Email failed (SMTP):", error)
      return false
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") console.info(`[email skipped, no SMTP or RESEND_API_KEY] ${message.subject}`)
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
export function emailLayout(email: { heading: string; body: string; action?: { label: string; href: string }; preview?: string; note?: string }) {
  return brandedEmail({ ...email, baseUrl: siteUrl() })
}
