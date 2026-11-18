// The branded Lucas Racing email layout. Plain code with no imports, so the same layout
// builds the site's emails (send.ts) and the Supabase sign-up and password emails
// (scripts/build-auth-emails.mjs). Email apps ignore most CSS: tables and inline styles only.

const colours = {
  carbon: "#111412",
  carbon2: "#1a1f1b",
  paper: "#f4f3ee",
  smoke: "#e8e7e0",
  brand: "#f95312",
  brandInk: "#b23a08",
  muted: "#5c635d",
}

const font = "Arial,Helvetica,sans-serif"
const displayFont = "'Arial Black','Helvetica Neue',Arial,sans-serif"

/** Escapes user-supplied text before it goes into an email's HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!)
}

export interface BrandedEmail {
  /** Site address without a trailing slash, e.g. https://lucasracing.co.uk. */
  baseUrl: string
  heading: string
  /** Already-escaped HTML. */
  body: string
  /** The main button. `href` is used as given (Supabase templates put {{ .TokenHash }} etc. in it). */
  action?: { label: string; href: string }
  /** The line inbox lists show after the subject. Defaults to the heading. */
  preview?: string
  /** Small print under the button, e.g. "Didn't sign up? You can ignore this email." */
  note?: string
}

/** One email in the Lucas Racing style: logo, orange stripe, white card, black footer. */
export function brandedEmail({ baseUrl, heading, body, action, preview, note }: BrandedEmail): string {
  const host = baseUrl.replace(/^https?:\/\//, "")
  const button = action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr>
<td bgcolor="${colours.brand}" style="border-radius:999px">
<a href="${action.href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${font};font-size:15px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${colours.carbon};text-decoration:none;border-radius:999px">${escapeHtml(action.label)}</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${colours.muted}">Button not working? Copy this link into your browser:<br><a href="${action.href}" style="color:${colours.brandInk};word-break:break-all">${action.href}</a></p>`
    : ""
  const small = note ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${colours.smoke};font-size:13px;line-height:1.5;color:${colours.muted}">${escapeHtml(note)}</p>` : ""
  const link = (path: string, label: string) => `<a href="${baseUrl}${path}" style="color:${colours.paper};text-decoration:underline">${label}</a>`

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${colours.paper};font-family:${font};color:${colours.carbon};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${colours.paper}">${escapeHtml(preview ?? heading)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${colours.paper}" style="background:${colours.paper}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

<tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:16px 16px 0 0;padding:24px 32px 20px">
<a href="${baseUrl}" style="text-decoration:none"><img src="${baseUrl}/images/brand/lucas-racing-logo.png" width="148" height="60" alt="Lucas Racing" style="display:block;border:0;outline:none"></a>
</td></tr>
<tr><td style="padding:0;font-size:0;line-height:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td height="6" bgcolor="${colours.brand}" style="background:${colours.brand};height:6px;font-size:0;line-height:0">&nbsp;</td></tr><tr>
<td height="3" bgcolor="${colours.carbon}" style="background:${colours.carbon};height:3px;font-size:0;line-height:0">&nbsp;</td></tr></table>
</td></tr>

<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:32px 32px 36px">
<h1 style="margin:0 0 18px;font-family:${displayFont};font-size:24px;line-height:1.2;font-weight:900;text-transform:uppercase;letter-spacing:.01em;color:${colours.carbon}">${escapeHtml(heading)}</h1>
<div style="font-size:15px;line-height:1.6;color:${colours.carbon}">${body}</div>
${button}
${small}
</td></tr>

<tr><td bgcolor="${colours.carbon}" style="background:${colours.carbon};border-radius:0 0 16px 16px;padding:24px 32px;font-size:12px;line-height:1.6;color:${colours.smoke}">
<p style="margin:0 0 6px;font-family:${displayFont};font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:#ffffff">Lucas <span style="color:${colours.brand}">Racing</span></p>
<p style="margin:0 0 12px">Family-run kart racing team · UK home of MS Kart · Custom helmets and parts by HydroKarts</p>
<p style="margin:0">${link("", escapeHtml(host))} &nbsp;·&nbsp; ${link("/contact", "Contact us")} &nbsp;·&nbsp; ${link("/privacy", "Privacy")}</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`
}
