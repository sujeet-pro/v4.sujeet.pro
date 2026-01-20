/**
 * Unified content utilities
 * Aggregates content from all collections for cross-collection operations
 */

import { getDeepDives, getNotes } from "./content-collection.utils"
import type { ContentItem, ContentItemWithoutContent } from "./content.type"

/**
 * Get all content across all content types
 * Returns content sorted by publishedOn date (newest first)
 */
export async function getAllContent(): Promise<ContentItem[]> {
  const [deepDives, notes] = await Promise.all([getDeepDives(), getNotes()])

  const allContent: ContentItem[] = [...deepDives, ...notes]

  // Sort by publishedOn descending
  allContent.sort((a, b) => {
    const dateA = new Date(a.publishedOn).getTime()
    const dateB = new Date(b.publishedOn).getTime()
    if (dateB !== dateA) {
      return dateB - dateA
    }
    return a.title.localeCompare(b.title)
  })

  return allContent
}

/**
 * Get all content items without Content component (for listings)
 */
export async function getAllContentItems(): Promise<ContentItemWithoutContent[]> {
  const allContent = await getAllContent()
  return allContent.map(({ Content: _, ...item }) => item) as ContentItemWithoutContent[]
}

/**
 * Get content by type
 */
export async function getContentByType(type: "deep-dive" | "notes"): Promise<ContentItem[]> {
  switch (type) {
    case "deep-dive":
      return getDeepDives()
    case "notes":
      return getNotes()
    default:
      return []
  }
}

/**
 * Get content item by ID (collection/path format)
 * e.g., "writing/javascript/patterns/2023-05-01-pub-sub"
 */
export async function getContentById(id: string): Promise<ContentItem | null> {
  const allContent = await getAllContent()
  return allContent.find((item) => item.id === id) ?? null
}

/**
 * Get content item by ID without Content component
 */
export async function getContentItemById(id: string): Promise<ContentItemWithoutContent | null> {
  const content = await getContentById(id)
  if (!content) return null
  const { Content: _, ...item } = content
  return item as ContentItemWithoutContent
}
