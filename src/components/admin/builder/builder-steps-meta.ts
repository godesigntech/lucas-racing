/**
 * The customer's 16-step journey, mapped to the admin page that sets each step up.
 * Steps with nothing to set up say how they work instead.
 */

/** The full journey, so the overview can show every step, including the automatic ones. */
export const journeySteps: { step: number; title: string; adminHref: string | null; note?: string }[] = [
  { step: 1, title: "Choose your helmet", adminHref: "/admin/builder/helmets" },
  { step: 2, title: "Choose your aero kit", adminHref: "/admin/builder/aero" },
  { step: 3, title: "Choose your design template", adminHref: "/admin/builder/templates" },
  { step: 4, title: "Customise your design colours", adminHref: "/admin/builder/colours" },
  { step: 5, title: "Choose your paint finishes", adminHref: "/admin/builder/colours" },
  { step: 6, title: "Add hydrographic films", adminHref: "/admin/builder/films" },
  { step: 7, title: "Customise your pinstripes", adminHref: "/admin/builder/colours" },
  { step: 8, title: "Choose your overall helmet finish", adminHref: "/admin/builder/lacquer" },
  { step: 9, title: "Add your personal details", adminHref: "/admin/builder/personalisation" },
  { step: 10, title: "Add sponsor & team logos", adminHref: "/admin/builder/personalisation" },
  { step: 11, title: "Customise your exterior components", adminHref: "/admin/builder/exterior" },
  { step: 12, title: "Choose your visor", adminHref: "/admin/builder/visors" },
  { step: 13, title: "Design your visor strip", adminHref: "/admin/builder/visors" },
  { step: 14, title: "Review your design", adminHref: null, note: "Automatic: the customer checks the 3D helmet and price." },
  { step: 15, title: "Confirm your order", adminHref: "/admin/builder/production", note: "Start week and rush delivery come from Production & delivery." },
  { step: 16, title: "We bring your design to life", adminHref: "/admin/orders", note: "Handled per order: send the proof, update the status, add finished photos." },
]
