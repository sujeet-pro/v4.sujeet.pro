/**
 * Writing content utilities
 * Handles blog posts from the "writing" collection
 * Simplified 2-level structure: writing/category
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { buildCategoryLookup, resolveCategoryFromFrontmatter } from "./content-categories-generic.utils"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { WritingContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/**
 * Extract category from item ID (first path segment)
 * Item IDs are relative paths like "javascript/2023-05-01-pub-sub"
 */
function getCategoryFromItemId(itemId: string): string {
  const firstSlash = itemId.indexOf("/")
  return firstSlash > 0 ? itemId.substring(0, firstSlash) : itemId
}

/**
 * Get all writing content (blog posts), excluding drafts in production
 */
export async function getWriting(): Promise<WritingContent[]> {
  const writing = await getCollection("writing")
  return filterDrafts(await processWritingCollection(writing))
}

/**
 * Get all writing content including drafts (for /all page)
 */
export async function getWritingIncludingDrafts(): Promise<WritingContent[]> {
  const writing = await getCollection("writing")
  return processWritingCollection(writing)
}

/**
 * Get featured writing content, sorted by rank (lower = higher priority)
 */
export async function getFeaturedWriting(): Promise<WritingContent[]> {
  const writing = await getWriting()
  return writing
    .filter((item) => item.featuredRank !== undefined && !item.isDraft)
    .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0))
}

/**
 * Process writing collection entries into WritingContent items
 */
async function processWritingCollection(items: CollectionEntry<"writing">[]): Promise<WritingContent[]> {
  const processed: WritingContent[] = []
  const categoryLookup = await buildCategoryLookup("writing")

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const { featuredRank } = item.data

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
      ...(featuredRank !== undefined && { featuredRank }),
      tags,
      Content,
      href: `/writing/${frontmatter.pageSlug}`,
      type: "writing",
      ...(categoryInfo && {
        category: categoryInfo.category,
      }),
    })
  }

  return sortByDateDescending(processed)
}
