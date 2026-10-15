import "server-only"

import { getSiteSettings } from "@/lib/data/settings"
import { formatMoney } from "@/lib/format"

import { emailLayout, escapeHtml, sendEmail, siteUrl } from "./send"

// Every email the site sends. Each is called from `after()` so it never slows
// down the customer, and sendEmail() quietly skips while email isn't set up.

/** The workshop inbox: the contact email in admin Settings, or WORKSHOP_EMAIL. */
async function workshopInbox(): Promise<string | null> {
  try {
    const settings = await getSiteSettings()
    return settings.contactEmail || process.env.WORKSHOP_EMAIL || null
  } catch {
    return process.env.WORKSHOP_EMAIL || null
  }
}

function paragraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 12px">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("")
}

function detailRows(rows: [string, string][]): string {
  const cells = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#5c635d;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join("")
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0 16px">${cells}</table>`
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface PlacedOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  deliveryLabel: string
  total: number
  items: { name: string; quantity: number; lineTotal: number; summary: { label: string; value: string }[] }[]
}

export async function notifyOrderPlaced(order: PlacedOrder): Promise<void> {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<p style="margin:16px 0 4px;font-weight:700">${escapeHtml(item.name)} × ${item.quantity} · ${escapeHtml(formatMoney(item.lineTotal))}</p>` +
        detailRows(item.summary.map((line) => [line.label, line.value])),
    )
    .join("")
  const itemsText = order.items
    .map((item) => `${item.name} x${item.quantity} (${formatMoney(item.lineTotal)})\n${item.summary.map((line) => `  ${line.label}: ${line.value}`).join("\n")}`)
    .join("\n\n")
  const firstName = order.customerName.split(" ")[0]

  await sendEmail({
    to: order.customerEmail,
    subject: `Order ${order.orderNumber} received – Lucas Racing`,
    html: emailLayout({
      heading: `Thanks ${firstName}, we've got your order`,
      body:
        paragraphs(
          `Your order ${order.orderNumber} is with the workshop. We'll email you a digital proof of your helmet to approve, along with how to pay. Nothing is painted until you've signed it off.`,
        ) +
        itemsHtml +
        detailRows([
          ["Delivery", order.deliveryLabel],
          ["Total", formatMoney(order.total)],
        ]),
      action: { label: "View your order", href: siteUrl(`/account/orders/${order.orderNumber}`) },
    }),
    text: `Thanks ${firstName}, we've got your order ${order.orderNumber}.\n\n${itemsText}\n\nDelivery: ${order.deliveryLabel}\nTotal: ${formatMoney(order.total)}\n\nWe'll email you a proof to approve before anything is painted.\n${siteUrl(`/account/orders/${order.orderNumber}`)}`,
  })

  const inbox = await workshopInbox()
  if (!inbox) return
  await sendEmail({
    to: inbox,
    replyTo: order.customerEmail,
    subject: `New order ${order.orderNumber} from ${order.customerName} – ${formatMoney(order.total)}`,
    html: emailLayout({
      heading: `New order ${order.orderNumber}`,
      body: detailRows([
        ["Customer", order.customerName],
        ["Email", order.customerEmail],
        ["Delivery", order.deliveryLabel],
        ["Total", formatMoney(order.total)],
      ]) + itemsHtml,
      action: { label: "Open in admin", href: siteUrl(`/admin/orders/${order.id}`) },
    }),
    text: `New order ${order.orderNumber} from ${order.customerName} (${order.customerEmail}), ${formatMoney(order.total)}.\n\n${itemsText}\n\n${siteUrl(`/admin/orders/${order.id}`)}`,
  })
}

// ---------------------------------------------------------------------------
// Design assistant quotes and contact enquiries
// ---------------------------------------------------------------------------

/** Admin quote list filtered to one reference. */
function quoteLink(reference: string): string {
  return siteUrl(`/admin/quotes?q=${encodeURIComponent(reference)}`)
}

export async function notifyNewQuote(quote: {
  reference: string
  name: string
  email: string
  phone: string
  helmet: string
  notes: string
  summary: string
}): Promise<void> {
  const inbox = await workshopInbox()
  if (!inbox) return
  await sendEmail({
    to: inbox,
    replyTo: quote.email,
    subject: `Quote request ${quote.reference} from ${quote.name}`,
    html: emailLayout({
      heading: `Quote request ${quote.reference}`,
      body:
        detailRows([
          ["Name", quote.name],
          ["Email", quote.email],
          ["Phone", quote.phone],
          ["Helmet", quote.helmet],
        ]) +
        (quote.summary ? paragraphs(`Concept: ${quote.summary}`) : "") +
        (quote.notes ? paragraphs(`Notes: ${quote.notes}`) : ""),
      action: { label: "See the photo and concept", href: quoteLink(quote.reference) },
    }),
    text: `Quote request ${quote.reference} from ${quote.name} (${quote.email}).\n${quote.summary}\n${quote.notes}\n${quoteLink(quote.reference)}`,
  })
}

export async function notifyNewEnquiry(enquiry: {
  name: string
  email: string
  phone: string
  topic: string
  design: string
  message: string
}): Promise<void> {
  const inbox = await workshopInbox()
  if (!inbox) return
  await sendEmail({
    to: inbox,
    replyTo: enquiry.email,
    subject: `Website enquiry: ${enquiry.topic} – ${enquiry.name}`,
    html: emailLayout({
      heading: "New website enquiry",
      body:
        detailRows([
          ["Name", enquiry.name],
          ["Email", enquiry.email],
          ["Phone", enquiry.phone],
          ["About", enquiry.topic],
          ["Design", enquiry.design],
        ]) + paragraphs(enquiry.message),
      action: { label: "Open enquiries", href: siteUrl("/admin/enquiries") },
    }),
    text: `Enquiry from ${enquiry.name} (${enquiry.email}${enquiry.phone ? `, ${enquiry.phone}` : ""})\nAbout: ${enquiry.topic}\n\n${enquiry.message}`,
  })
}

// ---------------------------------------------------------------------------
// Live chat: only the first unread message in a run is emailed, so a burst of
// messages sends one email.
// ---------------------------------------------------------------------------

export async function notifyCustomerMessage(message: { conversationId: string; customerName: string; body: string }): Promise<void> {
  const inbox = await workshopInbox()
  if (!inbox) return
  await sendEmail({
    to: inbox,
    subject: `New chat message from ${message.customerName || "a customer"}`,
    html: emailLayout({
      heading: `${message.customerName || "A customer"} sent a message`,
      body: paragraphs(message.body || "Sent a photo."),
      action: { label: "Reply in the admin panel", href: siteUrl(`/admin/messages/${message.conversationId}`) },
    }),
    text: `${message.customerName || "A customer"}: ${message.body || "Sent a photo."}\n\nReply: ${siteUrl(`/admin/messages/${message.conversationId}`)}`,
  })
}

export async function notifyWorkshopReply(reply: { customerEmail: string; customerName: string; body: string }): Promise<void> {
  if (!reply.customerEmail) return
  const firstName = reply.customerName.split(" ")[0] || "there"
  await sendEmail({
    to: reply.customerEmail,
    subject: "New message from the Lucas Racing workshop",
    html: emailLayout({
      heading: `Hi ${firstName}, the workshop replied`,
      body: paragraphs(reply.body || "We sent you a photo."),
      action: { label: "Open the chat", href: siteUrl("/account") },
    }),
    text: `Hi ${firstName}, the workshop replied:\n\n${reply.body || "We sent you a photo."}\n\nOpen the chat on ${siteUrl()} (bottom left, once you're logged in).`,
  })
}
