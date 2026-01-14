/**
 * Generic utility functions
 */

/**
 * Type guard to check if a value is non-nullish (not null and not undefined)
 *
 * @param value - Value to check
 * @returns True if value is not null and not undefined
 *
 * @example
 * const items = [1, null, 2, undefined, 3]
 * const filtered = items.filter(isNonNullish) // [1, 2, 3]
 */
export function isNonNullish<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
