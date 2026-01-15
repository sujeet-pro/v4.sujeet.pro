/**
 * Uses content utilities
 * Handles tools, setup, and productivity content
 * Simplified 2-level structure: uses/category
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { buildCategoryLookup, resolveCategoryFromFrontmatter } from "./content-categories-generic.utils"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { UsesContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/**
 * Extract category from item ID (first path segment)
 * Item IDs are relative paths like "productivity/2026-01-13-chrome-setup"
 */
function getCategoryFromItemId(itemId: string): string {
  const firstSlash = itemId.indexOf("/")
  return firstSlash > 0 ? itemId.substring(0, firstSlash) : itemId
}

/**
 * Get all uses content, excluding drafts in production
 */
export async function getUses(): Promise<UsesContent[]> {
  const uses = await getCollection("uses")
  return filterDrafts(await processUsesCollection(uses))
}

/**
 * Get all uses content including drafts (for /all page)
 */
export async function getUsesIncludingDrafts(): Promise<UsesContent[]> {
  const uses = await getCollection("uses")
  return processUsesCollection(uses)
}

/**
 * Process uses collection entries into UsesContent items
 */
async function processUsesCollection(items: CollectionEntry<"uses">[]): Promise<UsesContent[]> {
  const processed: UsesContent[] = []
  const categoryLookup = await buildCategoryLookup("uses")

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)

    // Category is derived from item ID (first path segment: category/date-slug)
    const categoryId = getCategoryFromItemId(item.id)
    const categoryInfo = resolveCategoryFromFrontmatter(categoryLookup, categoryId)

    processed.push({
      id: item.id,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      minutesRead: frontmatter.minutesRead,
      description: frontmatter.description,
      publishedOn: frontmatter.publishedOn,
      lastUpdatedOn: item.data.lastUpdatedOn,
      isDraft: frontmatter.isDraft,
      tags,
      Content,
      href: `/uses/${frontmatter.pageSlug}`,
      type: "uses",
      ...(categoryInfo && {
        category: categoryInfo.category,
      }),
    })
  }

  return sortByDateDescending(processed)
}
