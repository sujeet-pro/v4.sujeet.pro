/**
 * Work content utilities
 * Handles design docs, case studies, and architecture documents
 * Simplified 2-level structure: work/category
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { buildCategoryLookup, resolveCategoryFromFrontmatter } from "./content-categories-generic.utils"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { WorkContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/** Valid work content types */
type WorkType = "design-doc" | "architecture" | "case-study"

/**
 * Extract category from item ID (first path segment)
 * Item IDs are relative paths like "design-docs/2025-12-11-csp-sentinel"
 */
function getCategoryFromItemId(itemId: string): string {
  const firstSlash = itemId.indexOf("/")
  return firstSlash > 0 ? itemId.substring(0, firstSlash) : itemId
}

/**
 * Get all work content, excluding drafts in production
 */
export async function getWork(): Promise<WorkContent[]> {
  const work = await getCollection("work")
  return filterDrafts(await processWorkCollection(work))
}

/**
 * Get all work content including drafts (for /all page)
 */
export async function getWorkIncludingDrafts(): Promise<WorkContent[]> {
  const work = await getCollection("work")
  return processWorkCollection(work)
}

/**
 * Get work content filtered by type
 *
 * @param workType - Type to filter by (design-doc, architecture, case-study)
 */
export async function getWorkByType(workType: WorkType): Promise<WorkContent[]> {
  const work = await getWork()
  return work.filter((item) => item.workType === workType)
}

/**
 * Process work collection entries into WorkContent items
 */
async function processWorkCollection(items: CollectionEntry<"work">[]): Promise<WorkContent[]> {
  const processed: WorkContent[] = []
  const categoryLookup = await buildCategoryLookup("work")

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const { type: workType, lastUpdatedOn } = item.data

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
      lastUpdatedOn,
      isDraft: frontmatter.isDraft,
      tags,
      Content,
      href: `/work/${frontmatter.pageSlug}`,
      type: "work",
      workType,
      ...(categoryInfo && {
        category: categoryInfo.category,
      }),
    })
  }

  return sortByDateDescending(processed)
}
