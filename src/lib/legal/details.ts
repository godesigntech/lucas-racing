/**
 * The details that fill the gaps in the client's legal documents (src/content/legal, from
 * their "CONFIRM" fields). `confirmed: false` marks a stand-in until the client supplies
 * the real detail: pages using one show a "details being confirmed" note. Facts taken
 * from how the website works (cookies, providers) are marked confirmed.
 *
 * To complete a page: replace the value here and set confirmed to true.
 */
export interface LegalDetail {
  value: string
  confirmed: boolean
}

const draft = (value: string): LegalDetail => ({ value, confirmed: false })
const fact = (value: string): LegalDetail => ({ value, confirmed: true })

export const legalDetails = {
  // HydroKarts' new company (proposed: Lucas Racing by Hydro Karts Ltd).
  hydroName: draft("Lucas Racing by Hydro Karts Ltd"),
  hydroRegistration: draft(
    "Registered in England and Wales with company number 00000000. Registered office: 19 Harwood Court, Riverside Park Industrial Estate, Middlesbrough, TS2 1PU. VAT status to be confirmed.",
  ),
  publicationDate: draft("18 November 2026"),

  // Terms.
  orderAcceptance: draft(
    "An online order is accepted when we email you to confirm it. The automatic message sent straight after you order only confirms that we have received it.",
  ),

  // Privacy.
  generalWebsiteResponsibility: draft(
    "Lucas Racing (KARTS, PARTS & PREP LIMITED) is responsible for general website technical information, and for accounts and designs not yet linked to an order with either seller. Contact howard@lucasracing.co.uk about this information.",
  ),
  paymentDetails: draft(
    "Card details are entered on Stripe's secure payment pages and are handled only by Stripe. Each seller sees the payment status, amount, card type, the last four digits of the card and the transaction reference for its own orders.",
  ),
  lawfulBasis: draft(
    "We provide website accounts and free AI designs, and run the competition, on the basis of our legitimate interests in offering these services and running the competition fairly, and to take steps you ask us to take. Information about young racers is handled with extra care, as explained below.",
  ),
  deltaDetails: draft(
    "Delta Racewear is responsible for the personalisation details it collects. Lucas Racing shares your name, contact details and order details with Delta. Delta keeps your measurements for future orders unless you ask it to delete them, and explains this in its own privacy information.",
  ),
  providers: fact(
    "Supabase (accounts, database and file storage), Netlify (website delivery), Resend (emails), OpenAI, Google and Cloudflare (AI designs), delivery companies and our production suppliers",
  ),
  aiProvider: draft(
    "as follows: your prompt and any images you upload are sent to OpenAI, Google (Gemini) or Cloudflare to create the design. Under their business terms they do not use this material to train their models, keep it only for a limited time to monitor for abuse, and may process it in the United States",
  ),
  transfers: draft(
    "Some of our providers process information outside the UK, including in the United States and the European Economic Area (Supabase, Netlify, Resend, OpenAI, Google and Cloudflare). Where this happens they rely on UK adequacy regulations or the UK International Data Transfer Agreement or Addendum.",
  ),
  enquiryRetention: draft("12 months from our last contact"),
  orderRetention: draft("six years from the end of the financial year in which the order was completed"),
  designRetention: draft(
    "six years after the order is completed, so we can deal with any later questions or claims. Delta keeps the measurements it collects as described in its own privacy information",
  ),
  accountRetention: draft(
    "as long as your account is open. Accounts not used for three years are deleted with their saved designs, after we email you a reminder",
  ),
  logRetention: draft("up to 90 days"),
  competitionRetention: draft("until the vouchers expire, then deleted"),
  marketingRetention: draft("as long as you stay subscribed, and a record of any opt-out for as long as needed to respect your choice"),
  childrenPrivacy: draft(
    "as follows: children under 13 should not create their own account, so a parent or guardian should create it and use the design tools with them. Young racers aged 13 to 17 can use the website with a parent's or guardian's permission",
  ),

  // Cookies (from the live website: no analytics, advertising or tracking).
  cookieOperator: draft("KARTS, PARTS & PREP LIMITED trading as Lucas Racing, contactable at howard@lucasracing.co.uk"),
  cookieInventoryIntro: fact("listed in the table below. The website uses no advertising, analytics or tracking technologies"),
  cookieTable: fact(
    [
      "| Name | Provider | Purpose | How long | Basis |",
      "| --- | --- | --- | --- | --- |",
      "| sb-…-auth-token (cookies) | This website (Supabase) | Keeps you logged in to your account | Until you log out, renewed while you use the site | Strictly necessary |",
      "| lucas-racing:basket:v1 (local storage) | This website | Keeps the items in your basket | Until you empty the basket or clear your browser | Strictly necessary |",
      "| lucas-racing:builder-draft:v1 and lucas-racing:own-helmet-sketch:v1 (session storage) | This website | Keeps the helmet you're designing if you reload the page | Until you close the tab | Strictly necessary |",
      "| lucas-racing:ai-nudge-dismissed (session storage) | This website | Remembers that you closed the AI design tip | Until you close the tab | Strictly necessary for the setting you chose |",
      "| lucas-racing:competition-promo:… (local storage) | This website | Remembers that you closed the competition message | Until you clear your browser | Strictly necessary for the setting you chose |",
    ].join("\n"),
  ),
  optionalFeatures: fact(
    "This website does not currently use optional cookies or similar technologies, such as analytics or advertising. If we add any, they will only start after you choose to allow them here.",
  ),
  cookieSettingsLink: fact("the [cookie settings](/cookies#your-choices) at the bottom of this page"),
  embeddedServices: fact(
    "The website does not embed third-party content that reads or stores information on your device. Links to WhatsApp, Instagram and Facebook open those services only when you choose to follow them.",
  ),
  websitePrivacyEmail: draft("howard@lucasracing.co.uk"),

  // Competition.
  promoter: draft("KARTS, PARTS & PREP LIMITED trading as Lucas Racing, The Croft House, 750 Ripponden Road, Oldham, OL4 2LP"),
  competitionEmail: draft("info@hydrokarts.co.uk"),
  competitionAgeRules: draft(
    "the following: entrants under 16 need a parent's or guardian's permission and must enter through that parent's or guardian's account. Staff of Lucas Racing and HydroKarts and their immediate families cannot win the first prize",
  ),
  youngEntrants: draft("made through a parent's or guardian's account, with their permission"),
  openingDate: draft("at 12.00 am UK time on Saturday 14 November 2026"),
  sharingRequirement: fact(
    "to share your design on your story or in a post from your own account and tag @hydro.karts and @ms.lucasracing. Stories and posts both count. If you share a post, keep it visible until the winner is announced",
  ),
  tieCriteria: draft(
    "as follows: second to fifth places are ranked by number of valid votes. If designs tie for any of those places, the same judges rank the tied designs on creativity, use of hydrographic film and overall finish",
  ),
  voucherConditions: draft(
    "as follows: vouchers are redeemed by HydroKarts against the custom finishing price only, not helmets, delivery or other products. There is no minimum spend. Vouchers cannot be exchanged for cash, transferred or combined with another offer",
  ),
  winnerContact: draft("email to the address on the winner's website account"),
  prizeClaim: draft(
    "as follows: the winner must reply within 14 days of our message. If they do not reply or cannot accept the prize, we will offer it to the design with the next highest number of valid votes",
  ),
  competitionPrivacy: draft("entries and votes are deleted once the vouchers have expired"),
  winnerPublication: draft(
    "as follows: we will publish the winner's first name and winning design on our website and Facebook page. If you would prefer us not to publish your name, tell us when we contact you",
  ),
  platformStatement: draft(
    "This promotion is not sponsored, endorsed or administered by, or associated with, Facebook or Instagram. By entering, you release Meta from any liability connected with it.",
  ),
} satisfies Record<string, LegalDetail>

export type LegalDetailKey = keyof typeof legalDetails
