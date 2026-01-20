/**
 * Generic Content Collection Utilities
 *
 * Single source of truth for all content type operations.
 *
 * ## Architecture
 * - COLLECTION_CONFIG: Maps post types to content types and URL prefixes
 * - processCollection(): Generic processor for all content types
 * - Public API: Type-safe exports that maintain backward compatibility
 *
 * ## Post Types (folder structure under content/posts/)
 * - deep-dives: In-depth technical content (category is required)
 * - notes: Casual technical content - design docs, programming, tools, productivity (has optional `type`)
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { buildCategoryLookup, resolveCategoryFromFrontmatter } from "./content-categories-generic.utils"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { ContentItem, DeepDiveContent, NotesContent, PostType } from "./content.type"
import { filterDrafts } from "./draft.utils"

// =============================================================================
// Configuration
// =============================================================================

/**
 * Post type configuration mapping.
 * Maps post types to content types and URL prefixes.
 */
const POST_TYPE_CONFIG = {
  "deep-dives": { type: "deep-dive" as const, hrefPrefix: "/posts/deep-dives", categoryRequired: true },
  notes: { type: "notes" as const, hrefPrefix: "/posts/notes", categoryRequired: false },
} as const

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Extract post type from item ID (first path segment).
 * Item IDs are relative paths like "deep-dives/web-fundamentals/2023-05-01-http"
 */
function getPostTypeFromItemId(itemId: string): PostType {
  const firstSlash = itemId.indexOf("/")
  const postType = firstSlash > 0 ? itemId.substring(0, firstSlash) : itemId
  if (postType !== "deep-dives" && postType !== "notes") {
    throw new Error(`Invalid post type: ${postType} for item ${itemId}`)
  }
  return postType as PostType
}

/**
 * Extract category from item ID (second path segment after post type).
 * Item IDs are relative paths like "deep-dives/web-fundamentals/2023-05-01-http"
 */
function getCategoryFromItemId(itemId: string): string {
  const parts = itemId.split("/")
  // parts[0] = post-type (deep-dives, notes)
  // parts[1] = category
  return parts.length >= 2 ? parts[1] : itemId
}

/**
 * Process all posts from the unified collection.
 * Handles all content types with type-specific property extraction.
 */
async function processAllPosts(): Promise<ContentItem[]> {
  const items = await getCollection("posts")

  // Build category lookups for both post types
  const categoryLookups = {
    "deep-dives": await buildCategoryLookup("deep-dives"),
    notes: await buildCategoryLookup("notes"),
  }

  const processed: ContentItem[] = []

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const postType = getPostTypeFromItemId(item.id)
    const categoryId = getCategoryFromItemId(item.id)
    const config = POST_TYPE_CONFIG[postType]
    const categoryLookup = categoryLookups[postType]
    const categoryInfo = resolveCategoryFromFrontmatter(categoryLookup, categoryId)

    // Validate required category for deep-dives
    if (config.categoryRequired && !categoryInfo) {
      throw new Error(`Invalid category: ${categoryId} for ${postType} ${item.id}`)
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
      postType,
      type: config.type,
    }

    // Add type-specific properties and category
    switch (postType) {
      case "deep-dives": {
        processed.push({
          ...baseItem,
          postType: "deep-dives",
          type: "deep-dive",
          category: categoryInfo!.category, // Required, validated above
        } as DeepDiveContent)
        break
      }
      case "notes": {
        const notesItem = item as CollectionEntry<"posts">
        const { type: noteType } = notesItem.data
        processed.push({
          ...baseItem,
          postType: "notes",
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
// Public API - All Posts
// =============================================================================

/**
 * Get all posts, excluding drafts in production.
 */
export async function getPosts(): Promise<ContentItem[]> {
  const items = await processAllPosts()
  return filterDrafts(items)
}

/**
 * Get all posts including drafts.
 */
export async function getPostsIncludingDrafts(): Promise<ContentItem[]> {
  return processAllPosts()
}

// =============================================================================
// Public API - Deep Dives
// =============================================================================

/**
 * Get all deep dive content, excluding drafts in production.
 */
export async function getDeepDives(): Promise<DeepDiveContent[]> {
  const items = await getPosts()
  return items.filter((item): item is DeepDiveContent => item.postType === "deep-dives")
}

/**
 * Get all deep dive content including drafts.
 */
export async function getDeepDivesIncludingDrafts(): Promise<DeepDiveContent[]> {
  const items = await processAllPosts()
  return items.filter((item): item is DeepDiveContent => item.postType === "deep-dives")
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
  const items = await getPosts()
  return items.filter((item): item is NotesContent => item.postType === "notes")
}

/**
 * Get all notes content including drafts.
 */
export async function getNotesIncludingDrafts(): Promise<NotesContent[]> {
  const items = await processAllPosts()
  return items.filter((item): item is NotesContent => item.postType === "notes")
}

/**
 * Get notes content filtered by type.
 */
export async function getNotesByType(noteType: NoteType): Promise<NotesContent[]> {
  const notes = await getNotes()
  return notes.filter((item) => item.noteType === noteType)
}
