// Turns the client's legal documents (the .txt versions in their document pack) into the
// website's policy content: src/content/legal/<page>.ts. Each "[CONFIRM …]" field becomes
// a {{key}} filled from src/lib/legal/details.ts, and links to the pack's .html files
// point at the website's own pages.
//
//   node scripts/prepare-legal-pages.mjs "D:/downloads/lucasHelmentTemp/policies"
//
// Fails on any "[CONFIRM …]" field it doesn't know, so none slips onto a page unfilled.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const [source] = process.argv.slice(2)
if (!source) throw new Error("Usage: node scripts/prepare-legal-pages.mjs <policies folder>")

const pages = [
  { file: "terms-and-conditions.txt", slug: "terms" },
  { file: "privacy-policy.txt", slug: "privacy" },
  { file: "cookie-policy.txt", slug: "cookies" },
  { file: "delivery-returns-and-cancellations.txt", slug: "delivery-returns" },
  { file: "contact-and-complaints.txt", slug: "complaints" },
  { file: "cancellation-form.txt", slug: "cancellation-form" },
  { file: "competition-terms.txt", slug: "competition-terms" },
]

const links = {
  "terms-and-conditions.html": "/terms",
  "privacy-policy.html": "/privacy",
  "cookie-policy.html": "/cookies",
  "delivery-returns-and-cancellations.html": "/delivery-returns",
  "contact-and-complaints.html": "/complaints",
  "cancellation-form.html": "/cancellation-form",
  "competition-terms.html": "/competition/terms",
}

/** Each field in the pack, by its exact wording, to its key in details.ts. */
const fields = {
  "NEW CUSTOMISATION COMPANY REGISTERED NAME": "hydroName",
  "NEW COMPANY NUMBER PLACE OF REGISTRATION REGISTERED OFFICE AND VAT STATUS AFTER REGISTRATION": "hydroRegistration",
  "PUBLICATION DATE": "publicationDate",
  "WHEN AN ONLINE ORDER IS ACCEPTED AND WHICH EMAIL CONFIRMS ACCEPTANCE": "orderAcceptance",
  "RESPONSIBILITY AND PRIVACY CONTACT FOR GENERAL WEBSITE TECHNICAL DATA AND ACCOUNTS OR DESIGNS NOT YET ASSOCIATED WITH A SELLER": "generalWebsiteResponsibility",
  "WHICH PAYMENT DETAILS EACH SELLER CAN ACCESS AND WHICH ARE HANDLED ONLY BY STRIPE": "paymentDetails",
  "LAWFUL BASIS FOR WEBSITE ACCOUNTS FREE AI DESIGNS AND COMPETITION ADMINISTRATION INCLUDING INFORMATION ABOUT CHILDREN": "lawfulBasis",
  "DELTA LEGAL NAME DATA PROTECTION ROLE PRIVACY CONTACT AND HOW MEASUREMENTS ARE SHARED AND RETAINED": "deltaDetails",
  "ACCOUNT EMAIL AI ANALYTICS DELIVERY AND OTHER FULFILMENT PROVIDERS OR SUFFICIENTLY SPECIFIC RECIPIENT CATEGORIES": "providers",
  "AI PROVIDER INPUTS RETENTION TRAINING USE AND COUNTRIES OF PROCESSING": "aiProvider",
  "WHICH PROVIDERS PROCESS DATA OUTSIDE THE UK THE COUNTRIES OR RELEVANT LOCATIONS AND THE APPLICABLE ADEQUACY OR TRANSFER SAFEGUARDS": "transfers",
  "ENQUIRY RETENTION PERIOD OR CRITERIA": "enquiryRetention",
  "ORDER AND ACCOUNTING RETENTION PERIODS AND START POINT": "orderRetention",
  "DESIGN AND MEASUREMENT RETENTION INCLUDING DELTA": "designRetention",
  "ACCOUNT AND SAVED DESIGN RETENTION AND INACTIVITY RULE": "accountRetention",
  "LOG RETENTION PERIOD": "logRetention",
  "COMPETITION RETENTION CONSISTENT WITH THE PUBLISHED COMPETITION PROMISE": "competitionRetention",
  "MARKETING AND SUPPRESSION RECORD PERIOD OR CRITERIA": "marketingRetention",
  "AGE RULES PARENTAL INVOLVEMENT AND CHILD FRIENDLY PRIVACY INFORMATION": "childrenPrivacy",
  "WEBSITE OPERATOR AND COOKIE PRIVACY CONTACT": "cookieOperator",
  "COMPLETE LIVE COOKIE AND STORAGE INVENTORY": "cookieInventoryIntro",
  "ACTUAL INVENTORY ENTRIES WITH NAME PROVIDER PURPOSE DURATION AND CONSENT OR EXCEPTION": "cookieTable",
  "OPTIONAL FEATURES USED AND WHETHER CONSENT OR A SPECIFIC EXCEPTION APPLIES TO EACH": "optionalFeatures",
  "WORKING COOKIE SETTINGS LINK OR CONTROL": "cookieSettingsLink",
  "EMBEDDED OR THIRD PARTY SERVICES THAT ACCESS DEVICE INFORMATION AND THEIR PURPOSES": "embeddedServices",
  "WEBSITE PRIVACY EMAIL": "websitePrivacyEmail",
  "PROMOTER LEGAL NAME AND POSTAL ADDRESS": "promoter",
  "COMPETITION CONTACT EMAIL": "competitionEmail",
  "AGE RULES PARENTAL INVOLVEMENT AND ANY STAFF OR FAMILY EXCLUSIONS": "competitionAgeRules",
  "HOW ELIGIBLE YOUNG ENTRANTS PARTICIPATE": "youngEntrants",
  "OPENING DATE AND TIME": "openingDate",
  "POST OR STORY REQUIREMENT REQUIRED TAGS AND HOW LONG THE ENTRY MUST REMAIN VISIBLE": "sharingRequirement",
  "TIE CRITERIA JUDGING ARRANGEMENTS AND RANKING OF OTHER PRIZES": "tieCriteria",
  "FULL VOUCHER CONDITIONS AND WHICH SELLER REDEEMS THEM": "voucherConditions",
  "WINNER CONTACT METHOD": "winnerContact",
  "PRIZE CLAIM PROCESS AND DEADLINE": "prizeClaim",
  "COMPETITION PRIVACY DETAILS CONSISTENT WITH THE EXISTING DELETION PROMISE": "competitionPrivacy",
  "WINNER PUBLICATION AND OBJECTION ARRANGEMENTS": "winnerPublication",
  "THE REQUIRED FACEBOOK AND INSTAGRAM PROMOTION STATEMENTS AFTER CHECKING THE ACTUAL ENTRY METHOD AND CURRENT PLATFORM RULES": "platformStatement",
}

const outDir = "src/content/legal"
mkdirSync(outDir, { recursive: true })

for (const page of pages) {
  const text = readFileSync(path.join(source, page.file), "utf8").replace(/\r\n/g, "\n").trim()
  const [first, ...rest] = text.split("\n")
  const title = first.replace(/^#\s*/, "").trim()
  let body = rest.join("\n").trim()

  body = body.replace(/\[CONFIRM ([^\]]+)\]/g, (match, wording) => {
    const key = fields[wording.trim()]
    if (!key) throw new Error(`${page.file}: no field for "${match}"`)
    return `{{${key}}}`
  })
  for (const [from, to] of Object.entries(links)) body = body.split(`(${from})`).join(`(${to})`)
  if (/\.html\)/.test(body)) throw new Error(`${page.file}: a link to an .html file is left`)

  const fileText = `// From the client's document pack (${page.file}); regenerate with scripts/prepare-legal-pages.mjs.
// {{key}} fields are filled from src/lib/legal/details.ts.
const document = {
  title: ${JSON.stringify(title)},
  body: ${JSON.stringify(body)},
}

export default document
`
  writeFileSync(path.join(outDir, `${page.slug}.ts`), fileText)
  console.log(`${page.slug}: ${title} (${(body.match(/\{\{/g) ?? []).length} fields)`)
}
