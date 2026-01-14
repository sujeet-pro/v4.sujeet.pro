/**
 * Shared helper functions for content processing
 * Extracted to eliminate code duplication across content utility files
 */

import { render, type CollectionEntry } from "astro:content"
import { getTagsByRefs } from "./content-tags.utils"
import { remarkPluginFrontmatterSchema, type Tag } from "./content.type"

/**
 * Collection types that can be processed
 */
type ContentCollection = "writing" | "deep-dives" | "work" | "uses"

/**
 * Parsed frontmatter result from remark plugin
 */
export interface ParsedFrontmatter {
  title: string
  description: string
  minutesRead: string
  publishedOn: Date
  isDraft: boolean
  pageSlug: string
}

/**
 * Rendered content with parsed frontmatter and tags
 */
export interface RenderedContent {
  frontmatter: ParsedFrontmatter
  Content: Awaited<ReturnType<typeof render>>["Content"]
  tags: Tag[]
}

/**
 * Parse and validate frontmatter from a rendered content item
 *
 * @param remarkPluginFrontmatter - Raw frontmatter from remark plugin
 * @param itemId - Item ID for error messages
 * @returns Parsed and validated frontmatter
 * @throws Error if frontmatter validation fails
 */
export function parseFrontmatter(remarkPluginFrontmatter: unknown, itemId: string): ParsedFrontmatter {
  return remarkPluginFrontmatterSchema.parse(remarkPluginFrontmatter, {
    errorMap: (error) => ({
      message: `Error parsing frontmatter for ${itemId}: ${error.message}: ${JSON.stringify(error)}`,
    }),
  })
}

/**
 * Render a content item and extract frontmatter and tags
 *
 * @param item - Collection entry to render
 * @returns Rendered content with parsed frontmatter and resolved tags
 */
export async function renderContentItem<T extends ContentCollection>(
  item: CollectionEntry<T>,
): Promise<RenderedContent> {
  const { Content, remarkPluginFrontmatter } = await render(item)
  const frontmatter = parseFrontmatter(remarkPluginFrontmatter, item.id)
  const tags = await getTagsByRefs(item.data.tags as string[] | undefined)

  return { frontmatter, Content, tags }
}

/**
 * Sort content items by published date (newest first), then by title alphabetically
 *
 * @param items - Array of content items with publishedOn and title
 * @returns Sorted array (mutates original)
 */
export function sortByDateDescending<T extends { publishedOn: Date; title: string }>(items: T[]): T[] {
  return items.sort((a, b) => {
    const dateA = a.publishedOn.getTime()
    const dateB = b.publishedOn.getTime()
    if (dateB !== dateA) {
      return dateB - dateA
    }
    return a.title.localeCompare(b.title)
  })
}
