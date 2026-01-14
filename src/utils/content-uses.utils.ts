/**
 * Uses content utilities
 * Handles tools, setup, and productivity content
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { UsesContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/**
 * Get all uses content, excluding drafts in production
 */
export async function getUses(): Promise<UsesContent[]> {
  const uses = await getCollection("uses")
  return filterDrafts(await processUsesCollection(uses))
}

/**
 * Process uses collection entries into UsesContent items
 */
async function processUsesCollection(items: CollectionEntry<"uses">[]): Promise<UsesContent[]> {
  const processed: UsesContent[] = []

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)

    processed.push({
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
      href: `/uses/${frontmatter.pageSlug}`,
      type: "uses",
    })
  }

  return sortByDateDescending(processed)
}
