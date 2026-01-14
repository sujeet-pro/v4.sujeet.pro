import { getCollection, render } from "astro:content"
import { getTagsByRefs } from "./content-tags.utils"
import { remarkPluginFrontmatterSchema, type DeepDiveContent } from "./content.type"

export async function getDeepDives(): Promise<DeepDiveContent[]> {
  const deepDives = await getCollection("deepDives")
  const categories = await getCollection("categories")

  // Build category/subcategory lookup
  const categoryLookup = new Map<
    string,
    {
      category: { id: string; name: string }
      subcategory: { id: string; name: string }
    }
  >()

  for (const cat of categories) {
    for (const subcat of cat.data.subcategories) {
      const key = `${cat.id}/${subcat.id}`
      categoryLookup.set(key, {
        category: { id: cat.id, name: cat.data.name },
        subcategory: { id: subcat.id, name: subcat.name },
      })
    }
  }

  const items: DeepDiveContent[] = []

  for (const item of deepDives) {
    const { Content, remarkPluginFrontmatter } = await render(item)
    const { title, minutesRead, description, isDraft, publishedOn, pageSlug } = remarkPluginFrontmatterSchema.parse(
      remarkPluginFrontmatter,
      {
        errorMap: (error) => ({
          message: `Error parsing frontmatter for ${item.id}: ${error.message}: ${JSON.stringify(error)}`,
        }),
      },
    )
    const { lastUpdatedOn, category: categoryPath } = item.data
    const tags = await getTagsByRefs(item.data.tags)

    const lookup = categoryLookup.get(categoryPath)
    if (!lookup) {
      throw new Error(`Invalid category path: ${categoryPath} for deep-dive ${item.id}`)
    }

    items.push({
      id: item.id,
      pageSlug,
      title,
      minutesRead,
      description,
      publishedOn,
      lastUpdatedOn,
      isDraft,
      tags,
      Content,
      href: `/deep-dives/${pageSlug}`,
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

  // Sort by publishedOn descending
  items.sort((a, b) => {
    const dateA = new Date(a.publishedOn).getTime()
    const dateB = new Date(b.publishedOn).getTime()
    if (dateB !== dateA) {
      return dateB - dateA
    }
    return a.title.localeCompare(b.title)
  })

  // Filter drafts in production
  return items.filter((item) => !item.isDraft || import.meta.env.DEV)
}
