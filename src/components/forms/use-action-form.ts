"use client"

import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { toast } from "react-toastify"

import { isRedirectError } from "@/lib/is-redirect"
import type { ActionResult } from "@/types/account"

/**
 * Runs a Server Action from a react-hook-form submit handler: maps field errors
 * back onto the form and shows a toast. Returns true when the action succeeded.
 */
export async function runAction<T extends FieldValues, R>(
  action: () => Promise<ActionResult<R>>,
  setError: UseFormSetError<T>,
  successMessage?: string,
): Promise<ActionResult<R> | null> {
  try {
    const result = await action()
    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as Path<T>, { message })
      }
      toast.error(result.message)
      return result
    }
    const message = result.message ?? successMessage
    if (message) toast.success(message)
    return result
  } catch (error) {
    if (isRedirectError(error)) throw error
    toast.error("Something went wrong. Check your connection and try again.")
    return null
  }
}
