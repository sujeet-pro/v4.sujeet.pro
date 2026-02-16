/**
 * Text formatting utilities
 */

/**
 * Returns singular or plural form based on count
 * @param count - The number to check
 * @param singular - Singular form (e.g., "Article")
 * @param plural - Plural form (e.g., "Articles"), defaults to singular + "s"
 * @returns The appropriate form based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

/**
 * Returns count with singular or plural form
 * @param count - The number
 * @param singular - Singular form (e.g., "Article")
 * @param plural - Plural form (e.g., "Articles"), defaults to singular + "s"
 * @returns Formatted string like "1 Article" or "5 Articles"
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`
}

/**
 * Format an ISO date string as a human-readable date (e.g., "Jan 15, 2024")
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}
