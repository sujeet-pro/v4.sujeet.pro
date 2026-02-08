/**
 * Blog content processing utilities
 *
 * Processes the blog collection, sorts by publishedOn desc,
 * filters drafts/archived, and supports pinning.
 */

import { getCollection, render } from "astro:content"
import { parseFrontmatter } from "./helpers"
import { filterDrafts } from "./drafts"
import { getOrdering } from "./ordering"
import type { BlogCardInfo, BlogItem, BlogItemWithoutContent } from "./types"

// =============================================================================
// Internal Processing
// =============================================================================

let cachedBlogs: BlogItem[] | null = null

async function processAllBlogs(): Promise<BlogItem[]> {
  if (cachedBlogs) return cachedBlogs

  const blogItems = await getCollection("blog")
  const blogs: BlogItem[] = []

  for (const item of blogItems) {
    const { Content, remarkPluginFrontmatter } = await render(item)
    const frontmatter = parseFrontmatter(remarkPluginFrontmatter, item.id)

    blogs.push({
      id: item.id,
      title: frontmatter.title,
      description: frontmatter.description,
      minutesRead: frontmatter.minutesRead,
      isDraft: frontmatter.isDraft,
      publishedOn: item.data.publishedOn,
      lastUpdatedOn: item.data.lastUpdatedOn,
      archived: item.data.archived ?? false,
      tags: item.data.tags ?? [],
      href: `/blogs/${item.id}`,
      Content,
    })
  }

  // Sort by publishedOn descending (newest first), items without date go last
  blogs.sort((a, b) => {
    if (!a.publishedOn && !b.publishedOn) return 0
    if (!a.publishedOn) return 1
    if (!b.publishedOn) return -1
    return new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime()
  })

  cachedBlogs = blogs
  return cachedBlogs
}

function stripContent(blog: BlogItem): BlogItemWithoutContent {
  const { Content: _, ...rest } = blog
  return rest
}

function toBlogCard(blog: BlogItemWithoutContent): BlogCardInfo {
  return {
    id: blog.id,
    title: blog.title,
    description: blog.description,
    href: blog.href,
    minutesRead: blog.minutesRead,
    publishedOn: blog.publishedOn,
    lastUpdatedOn: blog.lastUpdatedOn,
    tags: blog.tags,
    isDraft: blog.isDraft,
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get all blog cards, filtered for drafts/archived, with pinned items first.
 */
export async function getAllBlogCards(): Promise<BlogCardInfo[]> {
  const allBlogs = await processAllBlogs()
  const ordering = await getOrdering()
  const pinnedSlugs = new Set(ordering.pinnedBlogs)

  const filtered = filterDrafts(allBlogs).filter((b) => !b.archived)
  const cards = filtered.map(stripContent).map(toBlogCard)

  // Move pinned items to front
  const pinned = cards.filter((c) => pinnedSlugs.has(c.id))
  const unpinned = cards.filter((c) => !pinnedSlugs.has(c.id))
  return [...pinned, ...unpinned]
}

/**
 * Get a single blog page with full content.
 */
export async function getBlogPage(slug: string): Promise<BlogItem | null> {
  const allBlogs = await processAllBlogs()
  return allBlogs.find((b) => b.id === slug) ?? null
}

/**
 * Get all blog paths for static generation.
 */
export async function getAllBlogPaths(): Promise<string[]> {
  const allBlogs = await processAllBlogs()
  return allBlogs.map((b) => b.id)
}
