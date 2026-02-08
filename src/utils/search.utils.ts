/**
 * Search indexing utilities
 * Generates Orama search index at build time
 */

import { create, insert, save } from "@orama/orama"
import { getAllArticles, getAllBlogCards, getAllProjectCards } from "./content"
import { SEARCH_SCHEMA, type FacetItem, type SearchDocument, type SearchFacets } from "./search.types"

/**
 * Build the Orama search index from all content
 * Returns serialized index as JSON string
 */
export async function buildSearchIndex(): Promise<string> {
  const db = create({
    schema: SEARCH_SCHEMA,
  })

  const allArticles = await getAllArticles()
  const allBlogs = await getAllBlogCards()
  const allProjects = await getAllProjectCards()

  // Index articles
  for (const item of allArticles) {
    const doc: SearchDocument = {
      id: item.id,
      title: item.title,
      description: item.description,
      contentType: "article",
      category: item.category.id,
      categoryName: item.category.name,
      topic: item.topic.id,
      topicName: item.topic.name,
      href: item.href,
      minutesRead: item.minutesRead,
    }

    await insert(db, doc)
  }

  // Index blogs
  for (const item of allBlogs) {
    const doc: SearchDocument = {
      id: item.id,
      title: item.title,
      description: item.description,
      contentType: "blog",
      category: "",
      categoryName: "",
      topic: "",
      topicName: "",
      href: item.href,
      minutesRead: item.minutesRead,
    }

    await insert(db, doc)
  }

  // Index projects
  for (const item of allProjects) {
    const doc: SearchDocument = {
      id: item.id,
      title: item.title,
      description: item.description,
      contentType: "project",
      category: "",
      categoryName: "",
      topic: "",
      topicName: "",
      href: item.href,
      minutesRead: item.minutesRead,
    }

    await insert(db, doc)
  }

  // Serialize and return
  const serialized = save(db)
  return JSON.stringify(serialized)
}

/**
 * Get facet options for the search filter UI with counts
 * Called at build time to populate filter dropdowns
 * Results are sorted by count (descending)
 */
export async function getSearchFacets(): Promise<SearchFacets> {
  const allContent = await getAllArticles()

  // Use Maps to track counts
  const categoryMap = new Map<string, { name: string; title: string; count: number }>()
  const topicMap = new Map<string, { name: string; title: string; categoryId: string; count: number }>()

  for (const item of allContent) {
    // Collect categories
    const catId = item.category.id
    const existingCat = categoryMap.get(catId)
    if (existingCat) {
      existingCat.count++
    } else {
      categoryMap.set(catId, { name: item.category.name, title: item.category.title, count: 1 })
    }

    // Collect topics
    const topicId = item.topic.id
    const existingTopic = topicMap.get(topicId)
    if (existingTopic) {
      existingTopic.count++
    } else {
      topicMap.set(topicId, {
        name: item.topic.name,
        title: item.topic.title,
        categoryId: item.category.id,
        count: 1,
      })
    }
  }

  // Convert to arrays and sort by count (descending)
  const categories: FacetItem[] = Array.from(categoryMap.entries())
    .map(([id, { name, title, count }]) => ({ id, name, title, count }))
    .sort((a, b) => b.count - a.count)

  const topics: FacetItem[] = Array.from(topicMap.entries())
    .map(([id, { name, title, categoryId, count }]) => ({ id, name, title, categoryId, count }))
    .sort((a, b) => b.count - a.count)

  return { categories, topics }
}
