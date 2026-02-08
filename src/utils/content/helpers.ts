/**
 * Shared helper functions for content processing
 * Extracted to eliminate code duplication across content utility files
 */

import { render, type CollectionEntry } from "astro:content"
import { remarkPluginFrontmatterSchema } from "./types"

/**
 * Parsed frontmatter result from remark plugin
 */
export interface ParsedFrontmatter {
  title: string
  description: string
  minutesRead: string
  isDraft: boolean
  pageSlug: string
}

/**
 * Rendered content with parsed frontmatter
 */
export interface RenderedContent {
  frontmatter: ParsedFrontmatter
  Content: Awaited<ReturnType<typeof render>>["Content"]
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
 * Render a content item and extract frontmatter
 *
 * @param item - Collection entry to render
 * @returns Rendered content with parsed frontmatter
 */
export async function renderContentItem(
  item: CollectionEntry<"category"> | CollectionEntry<"topic"> | CollectionEntry<"article">,
): Promise<RenderedContent> {
  const { Content, remarkPluginFrontmatter } = await render(item)
  const frontmatter = parseFrontmatter(remarkPluginFrontmatter, item.id)

  return { frontmatter, Content }
}

/**
 * Sort content items by title alphabetically
 *
 * @param items - Array of content items with title
 * @returns Sorted array (mutates original)
 */
export function sortByTitleAscending<T extends { title: string }>(items: T[]): T[] {
  return items.sort((a, b) => a.title.localeCompare(b.title))
}
