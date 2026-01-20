/**
 * In-Research Content Collection Utilities
 *
 * Handles processing of in-research content which:
 * - Has no categories
 * - Has no date/publishedOn requirement
 * - Uses simple slug-based URLs
 */

import { getCollection } from "astro:content"
import { renderInResearchItem, sortByTitleAscending } from "./content.helpers"
import type { InResearchContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Process all in-research content items
 */
async function processAllInResearch(): Promise<InResearchContent[]> {
  const items = await getCollection("inResearch")

  const processed: InResearchContent[] = []

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderInResearchItem(item)

    processed.push({
      id: item.id,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      minutesRead: frontmatter.minutesRead,
      description: frontmatter.description,
      lastReviewedOn: item.data.lastReviewedOn,
      isDraft: frontmatter.isDraft,
      tags,
      Content,
      href: `/in-research/${frontmatter.pageSlug}`,
      collectionType: "in-research",
      type: "in-research",
    })
  }

  return sortByTitleAscending(processed)
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get all in-research content, excluding drafts in production
 */
export async function getInResearch(): Promise<InResearchContent[]> {
  const items = await processAllInResearch()
  return filterDrafts(items)
}

/**
 * Get all in-research content including drafts
 */
export async function getInResearchIncludingDrafts(): Promise<InResearchContent[]> {
  return processAllInResearch()
}
