/**
 * Legacy Category Utilities (for deep-dives only)
 *
 * @deprecated Use content-categories-generic.utils.ts for new code
 * These functions maintain backward compatibility with existing /category/* pages
 */

import { getCategoriesForType } from "./content-categories-generic.utils"
import { getDeepDives } from "./content-deep-dives.utils"
import type { Category, DeepDiveContentItem } from "./content.type"

/**
 * Get all categories for deep-dives (legacy function)
 * @deprecated Use getCategoriesForType("deep-dives", items) instead
 */
export async function getAllCategories(): Promise<Category[]> {
  const allDeepDives = await getDeepDives()
  // Cast to DeepDiveContentItem[] (without Content) for the generic function
  const items = allDeepDives.map(({ Content: _, ...rest }) => rest) as DeepDiveContentItem[]
  const categories = await getCategoriesForType("deep-dives", items)

  // Transform to legacy Category format with /category/ URLs
  return categories.map((cat) => ({
    ...cat,
    href: `/category/${cat.id}`,
  }))
}

/**
 * Get featured categories for deep-dives (legacy function)
 * @deprecated Use getFeaturedCategoriesForType("deep-dives", items) instead
 */
export async function getFeaturedCategories(): Promise<Category[]> {
  const allCategories = await getAllCategories()
  return allCategories.filter((cat) => cat.featured)
}

/**
 * Get a specific category by ID for deep-dives (legacy function)
 * @deprecated Use getCategoryById("deep-dives", categoryId, items) instead
 */
export async function getCategoryById(categoryId: string): Promise<Category | undefined> {
  const allCategories = await getAllCategories()
  return allCategories.find((cat) => cat.id === categoryId)
}
