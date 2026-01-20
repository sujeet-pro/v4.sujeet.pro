/**
 * Generic Category Utilities
 * Provides functions to get categories for any content type
 * Simplified 2-level structure: posts/<post-type>/<category>
 */

import { getCollection } from "astro:content"
import type { CategoryRef, CategoryWithItems, ContentItemWithoutContent, PostType } from "./content.type"

// =============================================================================
// Collection Name and Labels
// =============================================================================

const POST_TYPE_LABELS: Record<PostType, string> = {
  "deep-dives": "Deep Dives",
  notes: "Notes",
}

export { POST_TYPE_LABELS }

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
export async function buildCategoryLookup(postType: PostType): Promise<Map<string, CategoryLookupResult>> {
  const categories = await getCollection("categories")
  const lookup = new Map<string, CategoryLookupResult>()

  // Filter categories by postType and build lookup
  for (const cat of categories) {
    if (cat.data.postType !== postType) continue

    // Extract the category ID (without postType prefix)
    const categoryId = cat.id.split("/")[1] || cat.id

    lookup.set(categoryId, {
      category: {
        id: categoryId,
        title: cat.data.title,
        name: cat.data.name,
        description: cat.data.description,
        href: `/posts/${postType}/${categoryId}`,
      },
    })
  }

  return lookup
}

/**
 * Get all categories for a post type with their items
 */
export async function getCategoriesForType(
  postType: PostType,
  items: ContentItemWithoutContent[],
): Promise<CategoryWithItems[]> {
  const categories = await getCollection("categories")

  // Filter categories by postType
  const typeCategories = categories.filter((cat) => cat.data.postType === postType)

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

  return typeCategories.map((cat) => {
    // Extract the category ID (without postType prefix)
    const categoryId = cat.id.split("/")[1] || cat.id
    const categoryItems = itemsByCategory.get(categoryId) || []

    return {
      id: categoryId,
      title: cat.data.title,
      name: cat.data.name,
      description: cat.data.description,
      items: categoryItems,
      href: `/posts/${postType}/${categoryId}`,
    }
  })
}

/**
 * Get a specific category by ID for a post type
 */
export async function getCategoryById(
  postType: PostType,
  categoryId: string,
  items: ContentItemWithoutContent[],
): Promise<CategoryWithItems | undefined> {
  const categories = await getCategoriesForType(postType, items)
  return categories.find((cat) => cat.id === categoryId)
}

/**
 * Get all categories across all post types
 * Returns a map of post type to categories
 */
export async function getAllCategoriesAcrossTypes(
  itemsByType: Map<PostType, ContentItemWithoutContent[]>,
): Promise<Map<PostType, CategoryWithItems[]>> {
  const result = new Map<PostType, CategoryWithItems[]>()

  for (const [type, items] of itemsByType) {
    const categories = await getCategoriesForType(type, items)
    result.set(type, categories)
  }

  return result
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
