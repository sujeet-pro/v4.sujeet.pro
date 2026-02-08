/**
 * Tag aggregation utilities
 *
 * Aggregates tags across articles, blogs, and projects.
 * Provides tag listing and content-by-tag lookups.
 */

import { getAllArticleCards } from "./content.cards"
import { getAllBlogCards } from "./content.blogs"
import { getAllProjectCards } from "./content.projects"
import type { ArticleCardInfo, BlogCardInfo, ProjectCardInfo, TagInfo } from "./content.types"

// =============================================================================
// Tag Normalization
// =============================================================================

/**
 * Normalize a tag string to a URL-safe slug.
 * Lowercase, trim, replace spaces with hyphens.
 */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

// =============================================================================
// Internal Processing
// =============================================================================

let cachedTagMap: Map<string, TagInfo> | null = null

async function buildTagMap(): Promise<Map<string, TagInfo>> {
  if (cachedTagMap) return cachedTagMap

  const tagMap = new Map<string, TagInfo>()

  function ensureTag(tag: string): TagInfo {
    const slug = normalizeTag(tag)
    let info = tagMap.get(slug)
    if (!info) {
      info = {
        tag,
        slug,
        count: 0,
        articles: [],
        blogs: [],
        projects: [],
      }
      tagMap.set(slug, info)
    }
    return info
  }

  // Collect article tags
  const articles = await getAllArticleCards()
  // Articles don't have tags field on ArticleCardInfo yet, but we'll handle
  // them via the tag field if present. For now articles use category/topic.
  // Tags will be populated when articles actually have tags set.

  // Collect blog tags
  const blogs = await getAllBlogCards()
  for (const blog of blogs) {
    for (const tag of blog.tags) {
      const info = ensureTag(tag)
      info.blogs.push(blog)
      info.count++
    }
  }

  // Collect project tags
  const projects = await getAllProjectCards()
  for (const project of projects) {
    for (const tag of project.tags) {
      const info = ensureTag(tag)
      info.projects.push(project)
      info.count++
    }
  }

  cachedTagMap = tagMap
  return cachedTagMap
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get all tags with counts, sorted by count descending.
 */
export async function getAllTags(): Promise<TagInfo[]> {
  const tagMap = await buildTagMap()
  return Array.from(tagMap.values())
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
}

/**
 * Get content for a specific tag by its slug.
 */
export async function getTagContent(tagSlug: string): Promise<TagInfo | null> {
  const tagMap = await buildTagMap()
  return tagMap.get(tagSlug) ?? null
}

/**
 * Get all tag slugs for static generation.
 */
export async function getAllTagSlugs(): Promise<string[]> {
  const tagMap = await buildTagMap()
  return Array.from(tagMap.keys()).filter((slug) => {
    const info = tagMap.get(slug)
    return info && info.count > 0
  })
}
