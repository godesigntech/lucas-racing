// Builds the Supabase Auth email templates (sign-up confirmation, password reset and the
// rest) in the same Lucas Racing layout as the site's own emails.
//
//   node scripts/build-auth-emails.mjs
//
// Writes supabase/templates/<name>.html. Paste each one into Supabase:
// Authentication > Emails > Templates, with the subject listed in supabase/templates/README.md.
//
// Every link is built from {{ .SiteURL }} (Authentication > URL Configuration > Site URL,
// which must be https://lucasracing.co.uk) and goes to /auth/confirm with a token hash, so it
// works even when the customer opens the email on another device or browser. It doesn't use
// {{ .RedirectTo }}: Supabase swaps that for the bare Site URL when the address isn't on its
// allow list, which broke the link.
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { brandedEmail } from "../src/lib/email/layout.ts"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(root, "supabase", "templates")
const baseUrl = "https://lucasracing.co.uk"
const p = (text) => `<p style="margin:0 0 12px">${text}</p>`
const siteLink = (type, next) => `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next=${encodeURIComponent(next)}`

const templates = [
  {
    file: "confirm-signup",
    name: "Confirm sign up",
    subject: "Confirm your Lucas Racing account",
    heading: "Welcome to Lucas Racing",
    body: p("Thanks for signing up. Please confirm your email address to finish setting up your account.") +
      p("Once you're in you can save helmet designs, follow your orders and message the team."),
    action: { label: "Confirm my email", href: siteLink("email", "/account") },
    note: "Didn't sign up? You can ignore this email and no account will be made.",
  },
  {
    file: "reset-password",
    name: "Reset password",
    subject: "Reset your Lucas Racing password",
    heading: "Reset your password",
    body: p("We got a request to reset the password for your Lucas Racing account.") +
      p("Press the button to choose a new password. The link works once and expires soon."),
    action: { label: "Choose a new password", href: siteLink("recovery", "/reset-password") },
    note: "Didn't ask for this? You can ignore this email. Your password stays the same.",
  },
  {
    file: "magic-link",
    name: "Magic link",
    subject: "Your Lucas Racing login link",
    heading: "Log in to Lucas Racing",
    body: p("Press the button to log in to your account. The link works once and expires soon."),
    action: { label: "Log in", href: siteLink("email", "/account") },
    note: "Didn't ask for this? You can ignore this email.",
  },
  {
    file: "change-email",
    name: "Change email address",
    subject: "Confirm your new email address",
    heading: "Confirm your new email",
    body: p("Please confirm you want to change your Lucas Racing account email from {{ .Email }} to {{ .NewEmail }}."),
    action: { label: "Confirm new email", href: siteLink("email_change", "/account") },
    note: "Didn't ask for this? Please contact us so we can check your account.",
  },
  {
    file: "invite-user",
    name: "Invite user",
    subject: "You're invited to Lucas Racing",
    heading: "You're invited",
    body: p("You've been invited to an account on the Lucas Racing website.") +
      p("Press the button to accept, then choose a password."),
    action: { label: "Accept invite", href: siteLink("invite", "/reset-password") },
    note: "Not expecting this? You can ignore this email.",
  },
  {
    file: "reauthentication",
    name: "Reauthentication",
    subject: "Your Lucas Racing security code",
    heading: "Your security code",
    body: p("Enter this code to confirm it's you:") +
      `<p style="margin:8px 0 12px;font-family:'Courier New',monospace;font-size:30px;font-weight:700;letter-spacing:.3em">{{ .Token }}</p>` +
      p("The code expires soon."),
    note: "Didn't ask for this? Please change your password and contact us.",
  },
]

mkdirSync(outDir, { recursive: true })
for (const { file, name, subject, ...email } of templates) {
  writeFileSync(join(outDir, `${file}.html`), brandedEmail({ ...email, baseUrl, preview: subject }) + "\n")
  console.log(`${name.padEnd(22)} ${subject}  ->  supabase/templates/${file}.html`)
}

const readme = `# Supabase email templates

Made by \`node scripts/build-auth-emails.mjs\` (don't edit the HTML by hand; change the script
or \`src/lib/email/layout.ts\` and run it again).

In Supabase: **Authentication > Emails > Templates**. For each one, paste the subject and
the whole HTML file into the message body, then save.

| Supabase template | Subject | File |
|---|---|---|
${templates.map((t) => `| ${t.name} | ${t.subject} | \`${t.file}.html\` |`).join("\n")}

The links are built from the Site URL in **Authentication > URL Configuration**, which must be
\`https://lucasracing.co.uk\`.
`
writeFileSync(join(outDir, "README.md"), readme)
