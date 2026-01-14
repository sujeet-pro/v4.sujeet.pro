import { SHOW_DRAFTS } from "astro:env/server"

/**
 * Check if draft content should be visible.
 *
 * Drafts are shown when:
 * - SHOW_DRAFTS env var is true (for GitHub builds)
 * - Running in development mode (local dev)
 *
 * Drafts are hidden when:
 * - SHOW_DRAFTS is false/unset AND not in dev mode (production/Cloudflare)
 */
export function shouldShowDrafts(): boolean {
  return SHOW_DRAFTS || import.meta.env.DEV
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
