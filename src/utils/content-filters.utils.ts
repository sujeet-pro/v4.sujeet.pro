/**
 * Content Filter Utilities
 * Provides functions to filter and aggregate content across types
 */

import {
  getDeepDives,
  getDeepDivesIncludingDrafts,
  getNotes,
  getNotesIncludingDrafts,
  getPosts,
  getPostsIncludingDrafts,
} from "./content-collection.utils"
import { sortByDateDescending } from "./content.helpers"
import type { ContentItemWithoutContent, PostType } from "./content.type"

// =============================================================================
// Content Getters by Type
// =============================================================================

type ContentGetter = () => Promise<ContentItemWithoutContent[]>

const CONTENT_GETTERS: Record<PostType, ContentGetter> = {
  "deep-dives": getDeepDives,
  notes: getNotes,
}

/**
 * Get all content for a specific post type
 */
export async function getContentForType(type: PostType): Promise<ContentItemWithoutContent[]> {
  const getter = CONTENT_GETTERS[type]
  return getter()
}

/**
 * Get all content items grouped by post type
 */
export async function getAllContentByType(): Promise<Map<PostType, ContentItemWithoutContent[]>> {
  const result = new Map<PostType, ContentItemWithoutContent[]>()

  const types: PostType[] = ["deep-dives", "notes"]
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
 * Get content filtered by category for a specific post type
 */
export async function getContentByCategory(type: PostType, categoryId: string): Promise<ContentItemWithoutContent[]> {
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
  const items = await getPosts()
  // Remove Content from items
  const itemsWithoutContent = items.map(({ Content: _, ...rest }) => rest)
  return sortByDateDescending(itemsWithoutContent)
}

/**
 * Get recent content from all types (limited count)
 */
export async function getRecentContent(limit: number = 10): Promise<ContentItemWithoutContent[]> {
  const allContent = await getAllContentChronological()
  return allContent.slice(0, limit)
}

/**
 * Get content counts by post type
 */
export async function getContentCounts(): Promise<Record<PostType, number>> {
  const contentByType = await getAllContentByType()
  const counts: Record<PostType, number> = {
    "deep-dives": 0,
    notes: 0,
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
  const items = await getPostsIncludingDrafts()
  // Remove Content from items
  const itemsWithoutContent = items.map(({ Content: _, ...rest }) => rest)
  return sortByDateDescending(itemsWithoutContent)
}
