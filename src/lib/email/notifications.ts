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
  /** Helmet orders get a proof to approve; product-only orders don't. */
  hasHelmets: boolean
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
          order.hasHelmets
            ? `Your order ${order.orderNumber} is with the workshop. We'll email you a digital proof of your helmet to approve, along with how to pay. Nothing is painted until you've signed it off.`
            : `Your order ${order.orderNumber} is with the team. We'll confirm it and send you a secure payment link.`,
        ) +
        itemsHtml +
        detailRows([
          ["Delivery", order.deliveryLabel],
          ["Total", formatMoney(order.total)],
        ]),
      action: { label: "View your order", href: siteUrl(`/account/orders/${order.orderNumber}`) },
    }),
    text: `Thanks ${firstName}, we've got your order ${order.orderNumber}.\n\n${itemsText}\n\nDelivery: ${order.deliveryLabel}\nTotal: ${formatMoney(order.total)}\n\n${order.hasHelmets ? "We'll email you a proof to approve before anything is painted." : "We'll confirm your order and send a secure payment link."}\n${siteUrl(`/account/orders/${order.orderNumber}`)}`,
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

// ---------------------------------------------------------------------------
// Proofs and production
// ---------------------------------------------------------------------------

/** The workshop has sent a proof; the helmet waits until the customer answers. */
export async function notifyProofReady(proof: {
  orderNumber: string
  customerName: string
  customerEmail: string
  version: number
}): Promise<void> {
  const firstName = proof.customerName.split(" ")[0]
  const href = siteUrl(`/account/orders/${proof.orderNumber}`)
  const line =
    proof.version === 1
      ? `Your proof for order ${proof.orderNumber} is ready to look at.`
      : `We've sent an updated proof (number ${proof.version}) for order ${proof.orderNumber}.`

  await sendEmail({
    to: proof.customerEmail,
    subject: `Your helmet proof is ready – ${proof.orderNumber}`,
    html: emailLayout({
      heading: `${firstName}, your proof is ready`,
      body: paragraphs(
        `${line}\n\nHave a proper look, and either approve it or tell us what to change. Nothing is masked, painted or dipped until you've approved it, and there's no charge for changes at this stage.`,
      ),
      action: { label: "View and approve your proof", href },
    }),
    text: `${firstName}, ${line}\n\nApprove it, or tell us what to change. Nothing is painted until you approve.\n\n${href}`,
  })
}

/** The customer has answered a proof. Goes to the workshop, not the customer. */
export async function notifyProofAnswered(answer: {
  orderNumber: string
  customerName: string
  approved: boolean
  note: string
  version: number
}): Promise<void> {
  const inbox = await workshopInbox()
  if (!inbox) return
  const verdict = answer.approved ? "approved" : "asked for changes to"

  await sendEmail({
    to: inbox,
    subject: `${answer.customerName} ${verdict} proof ${answer.version} – ${answer.orderNumber}`,
    html: emailLayout({
      heading: answer.approved ? `Proof approved – ${answer.orderNumber}` : `Changes requested – ${answer.orderNumber}`,
      body:
        detailRows([
          ["Customer", answer.customerName],
          ["Order", answer.orderNumber],
          ["Proof", `Number ${answer.version}`],
        ]) + (answer.note ? paragraphs(answer.note) : ""),
      action: { label: "Open in admin", href: siteUrl(`/admin/orders?q=${encodeURIComponent(answer.orderNumber)}`) },
    }),
    text: `${answer.customerName} ${verdict} proof ${answer.version} on ${answer.orderNumber}.${answer.note ? `\n\n${answer.note}` : ""}`,
  })
}

/** Keeps the customer posted as their helmet moves through the workshop. */
export async function notifyOrderStatus(update: {
  orderNumber: string
  customerName: string
  customerEmail: string
  label: string
  description: string
  note: string
  estimatedCompletionDate: string | null
}): Promise<void> {
  const firstName = update.customerName.split(" ")[0]
  const href = siteUrl(`/account/orders/${update.orderNumber}`)

  await sendEmail({
    to: update.customerEmail,
    subject: `${update.orderNumber}: ${update.label} – Lucas Racing`,
    html: emailLayout({
      heading: `${firstName}, your order is ${update.label.toLowerCase()}`,
      body:
        paragraphs(update.description) +
        (update.note ? paragraphs(update.note) : "") +
        detailRows([
          ["Order", update.orderNumber],
          ["Status", update.label],
          ["Estimated completion", update.estimatedCompletionDate ?? ""],
        ]),
      action: { label: "Track your order", href },
    }),
    text: `${firstName}, order ${update.orderNumber} is now: ${update.label}.\n\n${update.description}${update.note ? `\n\n${update.note}` : ""}\n\n${href}`,
  })
}
