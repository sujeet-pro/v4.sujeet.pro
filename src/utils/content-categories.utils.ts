import { getCollection } from "astro:content"
import { getDeepDives } from "./content-deep-dives.utils"
import type { Category, DeepDiveContent, Subcategory } from "./content.type"

export async function getAllCategories(): Promise<Category[]> {
  const categoriesCollection = await getCollection("categories")
  const allDeepDives = await getDeepDives()

  // Group deep-dives by category/subcategory
  const deepDivesByPath = new Map<string, DeepDiveContent[]>()
  for (const dd of allDeepDives) {
    const key = `${dd.category.id}/${dd.subcategory.id}`
    if (!deepDivesByPath.has(key)) {
      deepDivesByPath.set(key, [])
    }
    deepDivesByPath.get(key)!.push(dd)
  }

  return categoriesCollection.map((cat) => {
    const subcategories: Subcategory[] = cat.data.subcategories.map((subcat) => {
      const path = `${cat.id}/${subcat.id}`
      const deepDives = deepDivesByPath.get(path) || []
      return {
        id: subcat.id,
        name: subcat.name,
        description: subcat.description,
        deepDives,
        href: `/category/${cat.id}/${subcat.id}`,
      }
    })

    const totalDeepDives = subcategories.reduce((sum, sub) => sum + sub.deepDives.length, 0)

    return {
      id: cat.id,
      name: cat.data.name,
      description: cat.data.description,
      featured: cat.data.featured,
      subcategories,
      href: `/category/${cat.id}`,
      totalDeepDives,
    }
  })
}

export async function getFeaturedCategories(): Promise<Category[]> {
  const allCategories = await getAllCategories()
  return allCategories.filter((cat) => cat.featured)
}

export async function getCategoryById(categoryId: string): Promise<Category | undefined> {
  const allCategories = await getAllCategories()
  return allCategories.find((cat) => cat.id === categoryId)
}
