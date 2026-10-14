import { configKeys, type ConfigOptionGroup, type HelmetConfiguration } from "@/types/configurator"

/** Encodes a build into URL search params so it can be shared as a link. */
export function configToSearchParams(config: HelmetConfiguration): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of configKeys) params.set(key, config[key])
  return params
}

/**
 * Reads a shared build from URL params, keeping only values that are valid
 * choices for this product. Anything unknown falls back to the default build.
 */
export function configFromSearchParams(
  params: URLSearchParams,
  defaults: HelmetConfiguration,
  groups: ConfigOptionGroup[],
): HelmetConfiguration {
  const next = { ...defaults }
  for (const group of groups) {
    const value = params.get(group.key)
    if (value && group.choices.some((choice) => choice.value === value)) next[group.key] = value
  }
  return next
}
