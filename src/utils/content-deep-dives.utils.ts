/**
 * Deep dives content utilities
 * Handles educational content with category/subcategory organization
 */

import { getCollection } from "astro:content"
import { renderContentItem, sortByDateDescending } from "./content.helpers"
import type { DeepDiveContent } from "./content.type"
import { filterDrafts } from "./draft.utils"

/**
 * Category/subcategory lookup entry
 */
interface CategoryLookupEntry {
  category: { id: string; name: string }
  subcategory: { id: string; name: string }
}

/**
 * Build a lookup map for category/subcategory paths
 */
async function buildCategoryLookup(): Promise<Map<string, CategoryLookupEntry>> {
  const categories = await getCollection("categories")
  const lookup = new Map<string, CategoryLookupEntry>()

  for (const cat of categories) {
    for (const subcat of cat.data.subcategories) {
      const key = `${cat.id}/${subcat.id}`
      lookup.set(key, {
        category: { id: cat.id, name: cat.data.name },
        subcategory: { id: subcat.id, name: subcat.name },
      })
    }
  }

  return lookup
}

/**
 * Get all deep dive content, excluding drafts in production
 */
export async function getDeepDives(): Promise<DeepDiveContent[]> {
  const deepDives = await getCollection("deep-dives")
  const categoryLookup = await buildCategoryLookup()
  const items: DeepDiveContent[] = []

  for (const item of deepDives) {
    const { frontmatter, Content, tags } = await renderContentItem(item)
    const { subcategory: subcategoryPath, lastUpdatedOn } = item.data

    const lookup = categoryLookup.get(subcategoryPath)
    if (!lookup) {
      throw new Error(`Invalid subcategory path: ${subcategoryPath} for deep-dive ${item.id}`)
    }

    items.push({
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
      href: `/deep-dives/${frontmatter.pageSlug}`,
      type: "deep-dive",
      category: {
        id: lookup.category.id,
        name: lookup.category.name,
        href: `/category/${lookup.category.id}`,
      },
      subcategory: {
        id: lookup.subcategory.id,
        name: lookup.subcategory.name,
        href: `/category/${lookup.category.id}/${lookup.subcategory.id}`,
      },
    })
  }

  return filterDrafts(sortByDateDescending(items))
}
