/**
 * Writing content utilities
 * Handles blog posts from the "writing" collection
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { WritingContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/**
 * Get all writing content (blog posts), excluding drafts in production
 */
export async function getWriting(): Promise<WritingContent[]> {
  const writing = await getCollection("writing")
  return filterDrafts(await processWritingCollection(writing))
}

/**
 * Get featured writing content, sorted by rank (lower = higher priority)
 */
export async function getFeaturedWriting(): Promise<WritingContent[]> {
  const writing = await getWriting()
  return writing
    .filter((item) => item.featuredRank !== undefined && !item.isDraft)
    .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0))
}

/**
 * Process writing collection entries into WritingContent items
 */
async function processWritingCollection(items: CollectionEntry<"writing">[]): Promise<WritingContent[]> {
  const processed: WritingContent[] = []

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const { featuredRank } = item.data

    processed.push({
      id: item.id,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      minutesRead: frontmatter.minutesRead,
      description: frontmatter.description,
      publishedOn: frontmatter.publishedOn,
      lastUpdatedOn: item.data.lastUpdatedOn,
      isDraft: frontmatter.isDraft,
      ...(featuredRank !== undefined && { featuredRank }),
      tags,
      Content,
      href: `/writing/${frontmatter.pageSlug}`,
      type: "writing",
    })
  }

  return sortByDateDescending(processed)
}
