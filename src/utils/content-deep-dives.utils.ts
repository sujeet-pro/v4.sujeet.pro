/**
 * Deep dives content utilities
 * Handles educational content with category organization
 * Simplified 2-level structure: deep-dives/category
 */

import { getCollection } from "astro:content"
import { buildCategoryLookup, resolveCategoryFromFrontmatter } from "./content-categories-generic.utils"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { DeepDiveContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/**
 * Extract category from item ID (first path segment)
 * Item IDs are relative paths like "design-problems/2024-01-02-url-shortener"
 */
function getCategoryFromItemId(itemId: string): string {
  const firstSlash = itemId.indexOf("/")
  return firstSlash > 0 ? itemId.substring(0, firstSlash) : itemId
}

/**
 * Process deep dives collection
 */
async function processDeepDivesCollection(): Promise<DeepDiveContent[]> {
  const deepDives = await getCollection("deep-dives")
  const categoryLookup = await buildCategoryLookup("deep-dives")
  const items: DeepDiveContent[] = []

  for (const item of deepDives) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const { lastUpdatedOn } = item.data

    // Category is derived from item ID (first path segment: category/date-slug)
    const categoryId = getCategoryFromItemId(item.id)

    // Resolve category
    const categoryInfo = resolveCategoryFromFrontmatter(categoryLookup, categoryId)
    if (!categoryInfo) {
      throw new Error(`Invalid category: ${categoryId} for deep-dive ${item.id}`)
    }

    items.push({
      id: item.id,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      minutesRead: frontmatter.minutesRead,
      description: frontmatter.description,
      publishedOn: frontmatter.publishedOn,
      lastUpdatedOn,
      isDraft: frontmatter.isDraft,
      tags,
      Content,
      href: `/deep-dives/${frontmatter.pageSlug}`,
      type: "deep-dive",
      category: categoryInfo.category,
    })
  }

  return sortByDateDescending(items)
}

/**
 * Get all deep dive content, excluding drafts in production
 */
export async function getDeepDives(): Promise<DeepDiveContent[]> {
  return filterDrafts(await processDeepDivesCollection())
}

/**
 * Get all deep dive content including drafts (for /all page)
 */
export async function getDeepDivesIncludingDrafts(): Promise<DeepDiveContent[]> {
  return processDeepDivesCollection()
}
