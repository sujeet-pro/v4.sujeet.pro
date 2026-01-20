/**
 * Tag content utilities
 * Handles tag resolution and formatting from tags.jsonc config
 */

import { getCollection } from "astro:content"
import type { Tag } from "./content.type"

/** Cached tag data (id -> { name, featured }) */
interface TagData {
  name: string
  featured: boolean
}
let tagsLookup: Map<string, TagData> | null = null

/**
 * Get or build the tags lookup map from tags.jsonc
 * Uses in-memory caching for performance
 */
async function getTagsLookup(): Promise<Map<string, TagData>> {
  if (tagsLookup) return tagsLookup

  const tagsConfig = await getCollection("tags")
  tagsLookup = new Map(
    tagsConfig.map((t) => [t.data.id, { name: t.data.name, featured: t.data.featured ?? false }]),
  )
  return tagsLookup
}

/**
 * Convert a tag ID to display name
 *
 * Resolution order:
 * 1. If configured in tags.jsonc, use that name
 * 2. Otherwise, auto-format: "my-tag-name" → "My tag name"
 *
 * @param tagId - Tag identifier
 * @param lookup - Tags lookup map
 * @returns Display name for the tag
 */
export function formatTagName(tagId: string, lookup: Map<string, TagData>): string {
  const tagData = lookup.get(tagId)
  if (tagData) {
    return tagData.name
  }

  // Auto-format: capitalize first word, replace hyphens with spaces
  return tagId
    .split("-")
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ")
}

/**
 * Check if a tag is featured
 *
 * @param tagId - Tag identifier
 * @param lookup - Tags lookup map
 * @returns True if tag is featured
 */
export function isTagFeatured(tagId: string, lookup: Map<string, TagData>): boolean {
  return lookup.get(tagId)?.featured ?? false
}

/**
 * Resolve tag references to full Tag objects
 * Tags don't need to be configured in tags.jsonc - they will be auto-formatted
 *
 * @param tagRefs - Array of tag IDs (may be undefined)
 * @returns Array of resolved Tag objects with id, name, href, and featured
 */
export async function getTagsByRefs(tagRefs: string[] | undefined): Promise<Tag[]> {
  if (!tagRefs || tagRefs.length === 0) return []

  const lookup = await getTagsLookup()

  return tagRefs.map((id) => ({
    id,
    name: formatTagName(id, lookup),
    href: `/tag/${id}`,
    featured: isTagFeatured(id, lookup),
  }))
}

/**
 * Get all unique tags used across all content collections
 * Returns tags sorted alphabetically by name
 */
export async function getAllUsedTags(): Promise<Tag[]> {
  const posts = await getCollection("posts")

  const tagSet = new Set<string>()

  posts.forEach((item) => {
    item.data.tags?.forEach((tag: string) => tagSet.add(tag))
  })

  const lookup = await getTagsLookup()

  return Array.from(tagSet)
    .map((id) => ({
      id,
      name: formatTagName(id, lookup),
      href: `/tag/${id}`,
      featured: isTagFeatured(id, lookup),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get all tags configured in tags.jsonc
 * Does not include auto-generated tags from content
 */
export async function getAllConfiguredTags(): Promise<Tag[]> {
  const tagsCollection = await getCollection("tags")
  return tagsCollection.map(
    (tag): Tag => ({
      id: tag.data.id,
      name: tag.data.name,
      href: `/tag/${tag.data.id}`,
      featured: tag.data.featured ?? false,
    }),
  )
}

/**
 * Get all featured tags from tags.jsonc
 * Returns tags that have featured: true, sorted alphabetically by name
 */
export async function getFeaturedTags(): Promise<Tag[]> {
  const tagsCollection = await getCollection("tags")
  return tagsCollection
    .filter((tag) => tag.data.featured === true)
    .map(
      (tag): Tag => ({
        id: tag.data.id,
        name: tag.data.name,
        href: `/tag/${tag.data.id}`,
        featured: true,
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Tag with usage count
 */
export interface TagWithCount extends Tag {
  count: number
}

/**
 * Get all unique tags used across all content collections with counts
 * Returns tags sorted by count (descending) then alphabetically by name
 */
export async function getAllTagsWithCounts(): Promise<TagWithCount[]> {
  const posts = await getCollection("posts")

  const tagCounts = new Map<string, number>()

  posts.forEach((item) => {
    item.data.tags?.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  const lookup = await getTagsLookup()

  return Array.from(tagCounts.entries())
    .map(([id, count]) => ({
      id,
      name: formatTagName(id, lookup),
      href: `/tag/${id}`,
      featured: isTagFeatured(id, lookup),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}
