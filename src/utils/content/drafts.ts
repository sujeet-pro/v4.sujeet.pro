/**
 * Draft filtering utilities
 */

/**
 * Check if draft content should be visible.
 * Drafts are shown in development mode.
 */
export function shouldShowDrafts(): boolean {
  return import.meta.env.DEV
}

/**
 * Filter out draft items based on draft visibility settings.
 */
export function filterDrafts<T extends { isDraft: boolean }>(items: T[]): T[] {
  if (shouldShowDrafts()) {
    return items
  }
  return items.filter((item) => !item.isDraft)
}
