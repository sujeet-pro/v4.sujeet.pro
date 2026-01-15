/**
 * Content Filter Utilities
 * Provides functions to filter and aggregate content across types
 */

import { sortByDateDescending } from "./content.helpers"
import type { ContentItemWithoutContent, ContentType } from "./content.type"
import { getDeepDives } from "./content-deep-dives.utils"
import { getUses } from "./content-uses.utils"
import { getWork } from "./content-work.utils"
import { getWriting } from "./content-writing.utils"

// =============================================================================
// Content Getters by Type
// =============================================================================

type ContentGetter = () => Promise<ContentItemWithoutContent[]>

const CONTENT_GETTERS: Record<ContentType, ContentGetter> = {
  writing: getWriting,
  "deep-dives": getDeepDives,
  work: getWork,
  uses: getUses,
}

/**
 * Get all content for a specific type
 */
export async function getContentForType(type: ContentType): Promise<ContentItemWithoutContent[]> {
  const getter = CONTENT_GETTERS[type]
  return getter()
}

/**
 * Get all content items grouped by type
 */
export async function getAllContentByType(): Promise<Map<ContentType, ContentItemWithoutContent[]>> {
  const result = new Map<ContentType, ContentItemWithoutContent[]>()

  const types: ContentType[] = ["writing", "deep-dives", "work", "uses"]
  const contentArrays = await Promise.all(types.map((type) => getContentForType(type)))

  types.forEach((type, index) => {
    result.set(type, contentArrays[index])
  })

  return result
}

// =============================================================================
// Category Filters
// =============================================================================

/**
 * Get content filtered by category for a specific type
 */
export async function getContentByCategory(
  type: ContentType,
  categoryId: string,
): Promise<ContentItemWithoutContent[]> {
  const items = await getContentForType(type)
  return items.filter((item) => item.category?.id === categoryId)
}

// =============================================================================
// Aggregated Content Functions
// =============================================================================

/**
 * Get all content from all types, sorted chronologically (newest first)
 */
export async function getAllContentChronological(): Promise<ContentItemWithoutContent[]> {
  const contentByType = await getAllContentByType()
  const allContent: ContentItemWithoutContent[] = []

  for (const items of contentByType.values()) {
    allContent.push(...items)
  }

  return sortByDateDescending(allContent)
}

/**
 * Get recent content from all types (limited count)
 */
export async function getRecentContent(limit: number = 10): Promise<ContentItemWithoutContent[]> {
  const allContent = await getAllContentChronological()
  return allContent.slice(0, limit)
}

/**
 * Get content counts by type
 */
export async function getContentCounts(): Promise<Record<ContentType, number>> {
  const contentByType = await getAllContentByType()
  const counts: Record<ContentType, number> = {
    writing: 0,
    "deep-dives": 0,
    work: 0,
    uses: 0,
  }

  for (const [type, items] of contentByType) {
    counts[type] = items.length
  }

  return counts
}

/**
 * Get all content from all types including drafts, sorted chronologically (newest first)
 */
export async function getAllContentIncludingDrafts(): Promise<ContentItemWithoutContent[]> {
  const { getWritingIncludingDrafts } = await import("./content-writing.utils")
  const { getDeepDivesIncludingDrafts } = await import("./content-deep-dives.utils")
  const { getWorkIncludingDrafts } = await import("./content-work.utils")
  const { getUsesIncludingDrafts } = await import("./content-uses.utils")

  const [writing, deepDives, work, uses] = await Promise.all([
    getWritingIncludingDrafts(),
    getDeepDivesIncludingDrafts(),
    getWorkIncludingDrafts(),
    getUsesIncludingDrafts(),
  ])

  const allContent: ContentItemWithoutContent[] = [...writing, ...deepDives, ...work, ...uses]
  return sortByDateDescending(allContent)
}
