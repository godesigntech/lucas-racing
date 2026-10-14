import type { z } from "zod"

import type { ActionResult } from "@/types/account"

/** Turns a failed Zod parse into an ActionResult with per-field messages. */
export function validationError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".")
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return { ok: false, message: "Please check the highlighted fields.", fieldErrors }
}

export function failure(message: string): ActionResult<never> {
  return { ok: false, message }
}

/** Database errors raised on purpose by our SQL use SQLSTATE 22023 or 28000 and are safe to show. */
export function databaseError(error: { code?: string; message: string }, fallback: string): ActionResult<never> {
  const userFacing = error.code === "22023" || error.code === "28000"
  if (!userFacing) console.error(error)
  return { ok: false, message: userFacing ? error.message : fallback }
}
