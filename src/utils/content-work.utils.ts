/**
 * Work content utilities
 * Handles design docs, case studies, and architecture documents
 */

import { getCollection, type CollectionEntry } from "astro:content"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { WorkContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/** Valid work content types */
type WorkType = "design-doc" | "architecture" | "case-study"

/**
 * Get all work content, excluding drafts in production
 */
export async function getWork(): Promise<WorkContent[]> {
  const work = await getCollection("work")
  return filterDrafts(await processWorkCollection(work))
}

/**
 * Get work content filtered by type
 *
 * @param workType - Type to filter by (design-doc, architecture, case-study)
 */
export async function getWorkByType(workType: WorkType): Promise<WorkContent[]> {
  const work = await getWork()
  return work.filter((item) => item.workType === workType)
}

/**
 * Process work collection entries into WorkContent items
 */
async function processWorkCollection(items: CollectionEntry<"work">[]): Promise<WorkContent[]> {
  const processed: WorkContent[] = []

  for (const item of items) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const { type: workType, lastUpdatedOn } = item.data

    processed.push({
      id: item.id,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      minutesRead: frontmatter.minutesRead,
      description: frontmatter.description,
      publishedOn: frontmatter.publishedOn,
      lastUpdatedOn,
      isDraft: frontmatter.isDraft,
      tags,
      Content,
      href: `/work/${frontmatter.pageSlug}`,
      type: "work",
      workType,
    })
  }

  return sortByDateDescending(processed)
}
