/**
 * Generic Content Collection Utilities
 *
 * Single source of truth for all content type operations.
 *
 * ## Architecture
 * - COLLECTION_CONFIG: Maps collection names to content types and URL prefixes
 * - processCollection(): Generic processor for all content types
 * - Public API: Type-safe exports that maintain backward compatibility
 *
 * ## Content Types
 * - deep-dives: In-depth technical content (category is required)
 * - notes: Casual technical content - design docs, programming, tools, productivity (has optional `type`)
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { buildCategoryLookup, resolveCategoryFromFrontmatter } from "./content-categories-generic.utils"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { ContentItem, ContentType, DeepDiveContent, NotesContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

// =============================================================================
// Configuration
// =============================================================================

/**
 * Collection configuration mapping.
 * Maps Astro collection names to content types and URL prefixes.
 */
const COLLECTION_CONFIG = {
  "deep-dives": { type: "deep-dive" as const, hrefPrefix: "/deep-dives", categoryRequired: true },
  notes: { type: "notes" as const, hrefPrefix: "/notes", categoryRequired: false },
} as const

type CollectionName = keyof typeof COLLECTION_CONFIG

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Extract category from item ID (first path segment).
 * Item IDs are relative paths like "javascript/2023-05-01-pub-sub"
 */
function getCategoryFromItemId(itemId: string): string {
  const firstSlash = itemId.indexOf("/")
  return firstSlash > 0 ? itemId.substring(0, firstSlash) : itemId
}

/**
 * Generic collection processor.
 * Handles all content types with type-specific property extraction.
 */
async function processCollection(collectionName: CollectionName): Promise<ContentItem[]> {
  const items = await getCollection(collectionName)
  const config = COLLECTION_CONFIG[collectionName]

  // Determine the content type for category lookup
  const categoryType: ContentType = collectionName === "deep-dives" ? "deep-dives" : (collectionName as ContentType)
  const categoryLookup = await buildCategoryLookup(categoryType)

  const processed: ContentItem[] = []

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const categoryId = getCategoryFromItemId(item.id)
    const categoryInfo = resolveCategoryFromFrontmatter(categoryLookup, categoryId)

    // Validate required category for deep-dives
    if (config.categoryRequired && !categoryInfo) {
      throw new Error(`Invalid category: ${categoryId} for ${collectionName} ${item.id}`)
    }

    // Build base content item
    const baseItem = {
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
      href: `${config.hrefPrefix}/${frontmatter.pageSlug}`,
      type: config.type,
    }

    // Add type-specific properties and category
    switch (collectionName) {
      case "deep-dives": {
        processed.push({
          ...baseItem,
          type: "deep-dive",
          category: categoryInfo!.category, // Required, validated above
        } as DeepDiveContent)
        break
      }
      case "notes": {
        const notesItem = item as CollectionEntry<"notes">
        const { type: noteType } = notesItem.data
        processed.push({
          ...baseItem,
          type: "notes",
          noteType,
          ...(categoryInfo && { category: categoryInfo.category }),
        } as NotesContent)
        break
      }
    }
  }

  return sortByDateDescending(processed)
}

// =============================================================================
// Public API - Deep Dives
// =============================================================================

/**
 * Get all deep dive content, excluding drafts in production.
 */
export async function getDeepDives(): Promise<DeepDiveContent[]> {
  const items = await processCollection("deep-dives")
  return filterDrafts(items) as DeepDiveContent[]
}

/**
 * Get all deep dive content including drafts.
 */
export async function getDeepDivesIncludingDrafts(): Promise<DeepDiveContent[]> {
  return processCollection("deep-dives") as Promise<DeepDiveContent[]>
}

// =============================================================================
// Public API - Notes
// =============================================================================

/** Valid note content types */
type NoteType = "design-doc" | "architecture" | "case-study"

/**
 * Get all notes content, excluding drafts in production.
 */
export async function getNotes(): Promise<NotesContent[]> {
  const items = await processCollection("notes")
  return filterDrafts(items) as NotesContent[]
}

/**
 * Get all notes content including drafts.
 */
export async function getNotesIncludingDrafts(): Promise<NotesContent[]> {
  return processCollection("notes") as Promise<NotesContent[]>
}

/**
 * Get notes content filtered by type.
 */
export async function getNotesByType(noteType: NoteType): Promise<NotesContent[]> {
  const notes = await getNotes()
  return notes.filter((item) => item.noteType === noteType)
}
