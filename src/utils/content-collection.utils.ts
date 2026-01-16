/**
 * Generic Content Collection Utilities
 *
 * Single source of truth for all content type operations.
 * Consolidates content-writing, content-deep-dives, content-work, and content-uses utilities.
 *
 * ## Architecture
 * - COLLECTION_CONFIG: Maps collection names to content types and URL prefixes
 * - processCollection(): Generic processor for all content types
 * - Public API: Type-safe exports that maintain backward compatibility
 *
 * ## Content Types
 * - writing: Blog posts (has optional `featuredRank`)
 * - deep-dives: Educational content (category is required)
 * - work: Design docs, case studies (has optional `workType`)
 * - uses: Tools and productivity content
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { buildCategoryLookup, resolveCategoryFromFrontmatter } from "./content-categories-generic.utils"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type {
  ContentItem,
  ContentType,
  DeepDiveContent,
  UsesContent,
  WorkContent,
  WritingContent,
} from "./content.type"
import { filterDrafts } from "./draft.utils"

// =============================================================================
// Configuration
// =============================================================================

/**
 * Collection configuration mapping.
 * Maps Astro collection names to content types and URL prefixes.
 */
const COLLECTION_CONFIG = {
  writing: { type: "writing" as const, hrefPrefix: "/writing", categoryRequired: false },
  "deep-dives": { type: "deep-dive" as const, hrefPrefix: "/deep-dives", categoryRequired: true },
  work: { type: "work" as const, hrefPrefix: "/work", categoryRequired: false },
  uses: { type: "uses" as const, hrefPrefix: "/uses", categoryRequired: false },
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
      case "writing": {
        const writingItem = item as CollectionEntry<"writing">
        const { featuredRank } = writingItem.data
        processed.push({
          ...baseItem,
          type: "writing",
          ...(featuredRank !== undefined && { featuredRank }),
          ...(categoryInfo && { category: categoryInfo.category }),
        } as WritingContent)
        break
      }
      case "deep-dives": {
        processed.push({
          ...baseItem,
          type: "deep-dive",
          category: categoryInfo!.category, // Required, validated above
        } as DeepDiveContent)
        break
      }
      case "work": {
        const workItem = item as CollectionEntry<"work">
        const { type: workType } = workItem.data
        processed.push({
          ...baseItem,
          type: "work",
          workType,
          ...(categoryInfo && { category: categoryInfo.category }),
        } as WorkContent)
        break
      }
      case "uses": {
        processed.push({
          ...baseItem,
          type: "uses",
          ...(categoryInfo && { category: categoryInfo.category }),
        } as UsesContent)
        break
      }
    }
  }

  return sortByDateDescending(processed)
}

// =============================================================================
// Public API - Writing
// =============================================================================

/**
 * Get all writing content (blog posts), excluding drafts in production.
 */
export async function getWriting(): Promise<WritingContent[]> {
  const items = await processCollection("writing")
  return filterDrafts(items) as WritingContent[]
}

/**
 * Get all writing content including drafts.
 */
export async function getWritingIncludingDrafts(): Promise<WritingContent[]> {
  return processCollection("writing") as Promise<WritingContent[]>
}

/**
 * Get featured writing content, sorted by rank (lower = higher priority).
 */
export async function getFeaturedWriting(): Promise<WritingContent[]> {
  const writing = await getWriting()
  return writing
    .filter((item) => item.featuredRank !== undefined && !item.isDraft)
    .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0))
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
// Public API - Work
// =============================================================================

/** Valid work content types */
type WorkType = "design-doc" | "architecture" | "case-study"

/**
 * Get all work content, excluding drafts in production.
 */
export async function getWork(): Promise<WorkContent[]> {
  const items = await processCollection("work")
  return filterDrafts(items) as WorkContent[]
}

/**
 * Get all work content including drafts.
 */
export async function getWorkIncludingDrafts(): Promise<WorkContent[]> {
  return processCollection("work") as Promise<WorkContent[]>
}

/**
 * Get work content filtered by type.
 */
export async function getWorkByType(workType: WorkType): Promise<WorkContent[]> {
  const work = await getWork()
  return work.filter((item) => item.workType === workType)
}

// =============================================================================
// Public API - Uses
// =============================================================================

/**
 * Get all uses content, excluding drafts in production.
 */
export async function getUses(): Promise<UsesContent[]> {
  const items = await processCollection("uses")
  return filterDrafts(items) as UsesContent[]
}

/**
 * Get all uses content including drafts.
 */
export async function getUsesIncludingDrafts(): Promise<UsesContent[]> {
  return processCollection("uses") as Promise<UsesContent[]>
}
