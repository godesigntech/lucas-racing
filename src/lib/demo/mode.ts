/**
 * Demo mode runs the whole UI on built-in sample data, with Supabase switched off.
 * Turn it on with DEMO_MODE=true in .env.local; remove it once the database is set up.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true"
}

export const DEMO_READ_ONLY = {
  ok: false as const,
  message: "Demo mode: changes aren't saved. Connect Supabase to make this work for real.",
}
