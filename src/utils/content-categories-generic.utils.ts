/**
 * Generic Category Utilities
 * Provides functions to get categories for any content type
 * Simplified 2-level structure: content-type/category
 */

import { getCollection } from "astro:content"
import type { CategoryRef, CategoryWithItems, ContentItemWithoutContent, ContentType } from "./content.type"

// =============================================================================
// Collection Name Mapping
// =============================================================================

const CATEGORY_COLLECTION_MAP: Record<ContentType, string> = {
  writing: "categories-writing",
  "deep-dives": "categories-deep-dives",
  work: "categories-work",
  uses: "categories-uses",
} as const

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  writing: "Writing",
  "deep-dives": "Deep Dives",
  work: "Work",
  uses: "Uses",
}

export { CONTENT_TYPE_LABELS }

// =============================================================================
// Category Lookup Types
// =============================================================================

interface CategoryLookupResult {
  category: CategoryRef
}

// =============================================================================
// Category Lookup Functions
// =============================================================================

/**
 * Build a lookup map for category IDs to their refs
 * Used when processing content items to resolve category info
 */
export async function buildCategoryLookup(contentType: ContentType): Promise<Map<string, CategoryLookupResult>> {
  const collectionName = CATEGORY_COLLECTION_MAP[contentType]
  const categories = await getCollection(collectionName as "categories-writing")
  const lookup = new Map<string, CategoryLookupResult>()

  for (const cat of categories) {
    lookup.set(cat.id, {
      category: {
        id: cat.id,
        name: cat.data.name,
        description: cat.data.description,
        href: `/${contentType}/${cat.id}`,
      },
    })
  }

  return lookup
}

/**
 * Get all categories for a content type with their items
 */
export async function getCategoriesForType(
  contentType: ContentType,
  items: ContentItemWithoutContent[],
): Promise<CategoryWithItems[]> {
  const collectionName = CATEGORY_COLLECTION_MAP[contentType]
  const categories = await getCollection(collectionName as "categories-writing")

  // Group items by category
  const itemsByCategory = new Map<string, ContentItemWithoutContent[]>()
  for (const item of items) {
    if (item.category) {
      const key = item.category.id
      if (!itemsByCategory.has(key)) {
        itemsByCategory.set(key, [])
      }
      itemsByCategory.get(key)!.push(item)
    }
  }

  return categories.map((cat) => {
    const categoryItems = itemsByCategory.get(cat.id) || []
    return {
      id: cat.id,
      name: cat.data.name,
      description: cat.data.description,
      featured: cat.data.featured,
      items: categoryItems,
      href: `/${contentType}/${cat.id}`,
    }
  })
}

/**
 * Get a specific category by ID for a content type
 */
export async function getCategoryById(
  contentType: ContentType,
  categoryId: string,
  items: ContentItemWithoutContent[],
): Promise<CategoryWithItems | undefined> {
  const categories = await getCategoriesForType(contentType, items)
  return categories.find((cat) => cat.id === categoryId)
}

/**
 * Get all categories across all content types
 * Returns a map of content type to categories
 */
export async function getAllCategoriesAcrossTypes(
  itemsByType: Map<ContentType, ContentItemWithoutContent[]>,
): Promise<Map<ContentType, CategoryWithItems[]>> {
  const result = new Map<ContentType, CategoryWithItems[]>()

  for (const [type, items] of itemsByType) {
    const categories = await getCategoriesForType(type, items)
    result.set(type, categories)
  }

  return result
}

/**
 * Get featured categories for a content type
 */
export async function getFeaturedCategoriesForType(
  contentType: ContentType,
  items: ContentItemWithoutContent[],
): Promise<CategoryWithItems[]> {
  const categories = await getCategoriesForType(contentType, items)
  return categories.filter((cat) => cat.featured)
}

/**
 * Resolve category from content frontmatter/path
 * Used when processing individual content items
 */
export function resolveCategoryFromFrontmatter(
  lookup: Map<string, CategoryLookupResult>,
  categoryId: string | undefined,
): CategoryLookupResult | undefined {
  if (!categoryId) return undefined
  return lookup.get(categoryId)
}
