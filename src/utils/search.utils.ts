/**
 * Search indexing utilities
 * Generates Orama search index at build time
 */

import { create, insert, save } from "@orama/orama"
import { getAllSeries } from "./content-series.utils"
import { getAllContentItems } from "./content.utils"
import {
  SEARCH_SCHEMA,
  type FacetItem,
  type SearchDocument,
  type SearchFacets,
  type SubcategoryFacetItem,
} from "./search.types"

/**
 * Build the Orama search index from all content
 * Returns serialized index as JSON string
 */
export async function buildSearchIndex(): Promise<string> {
  const db = await create({
    schema: SEARCH_SCHEMA,
  })

  const allContent = await getAllContentItems()
  const allSeries = await getAllSeries()

  // Build series lookup: contentId -> series info
  const seriesLookup = new Map<string, { id: string; name: string }>()
  for (const series of allSeries) {
    for (const item of series.items) {
      seriesLookup.set(item.id, { id: series.id, name: series.name })
    }
  }

  // Index each content item
  for (const item of allContent) {
    const seriesInfo = seriesLookup.get(item.id)

    const doc: SearchDocument = {
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      category: item.type === "deep-dive" ? item.category.id : "",
      subcategory: item.type === "deep-dive" ? item.subcategory.id : "",
      categoryName: item.type === "deep-dive" ? item.category.name : "",
      subcategoryName: item.type === "deep-dive" ? item.subcategory.name : "",
      tags: item.tags.map((t) => t.id),
      tagNames: item.tags.map((t) => t.name),
      href: item.href,
      publishedOn: item.publishedOn.getTime(),
      minutesRead: item.minutesRead,
      seriesId: seriesInfo?.id ?? "",
      seriesName: seriesInfo?.name ?? "",
    }

    await insert(db, doc)
  }

  // Serialize and return
  const serialized = await save(db)
  return JSON.stringify(serialized)
}

/**
 * Get facet options for the search filter UI with counts
 * Called at build time to populate filter dropdowns
 * Results are sorted by count (descending)
 */
export async function getSearchFacets(): Promise<SearchFacets> {
  const allContent = await getAllContentItems()

  // Use Maps to track counts
  const categoryMap = new Map<string, { name: string; count: number }>()
  const subcategoryMap = new Map<string, { name: string; categoryId: string; count: number }>()
  const tagMap = new Map<string, { name: string; count: number }>()

  for (const item of allContent) {
    // Collect categories and subcategories from deep-dives
    if (item.type === "deep-dive") {
      const catId = item.category.id
      const existing = categoryMap.get(catId)
      if (existing) {
        existing.count++
      } else {
        categoryMap.set(catId, { name: item.category.name, count: 1 })
      }

      const subcatId = item.subcategory.id
      const existingSubcat = subcategoryMap.get(subcatId)
      if (existingSubcat) {
        existingSubcat.count++
      } else {
        subcategoryMap.set(subcatId, {
          name: item.subcategory.name,
          categoryId: catId,
          count: 1,
        })
      }
    }

    // Collect all tags
    for (const tag of item.tags) {
      const existing = tagMap.get(tag.id)
      if (existing) {
        existing.count++
      } else {
        tagMap.set(tag.id, { name: tag.name, count: 1 })
      }
    }
  }

  // Convert to arrays and sort by count (descending)
  const categories: FacetItem[] = Array.from(categoryMap.entries())
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)

  const subcategories: SubcategoryFacetItem[] = Array.from(subcategoryMap.entries())
    .map(([id, { name, categoryId, count }]) => ({ id, name, categoryId, count }))
    .sort((a, b) => b.count - a.count)

  const tags: FacetItem[] = Array.from(tagMap.entries())
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)

  return { categories, subcategories, tags }
}
