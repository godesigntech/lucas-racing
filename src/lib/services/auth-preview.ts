import type { LoginFormValues, SignupFormValues } from "@/lib/validations/auth"

import { simulateLatency, type ServiceResult } from "./mock"

/*
 * Preview-only account flows. They validate input and simulate a request, but
 * no account is created, stored or signed in. Real authentication (Supabase
 * Auth) will replace these functions without changing the form components.
 */

export async function previewSignUp(values: SignupFormValues): Promise<ServiceResult> {
  await simulateLatency()
  return {
    ok: true,
    message: `Looks good, ${values.fullName.split(" ")[0]}. Accounts open soon; nothing was saved in this preview.`,
  }
}

export async function previewLogin(values: LoginFormValues): Promise<ServiceResult> {
  await simulateLatency()
  return {
    ok: true,
    message: `Sign-in for ${values.email} isn't live yet. Accounts open soon.`,
  }
}
