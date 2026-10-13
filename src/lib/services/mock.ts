export interface ServiceResult {
  ok: boolean
  message: string
}

/** Simulated network latency for preview-only services. */
export function simulateLatency(ms = 900): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
