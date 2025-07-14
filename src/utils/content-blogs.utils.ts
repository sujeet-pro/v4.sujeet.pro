import { getCollection, render, type CollectionEntry } from "astro:content"
import { getTagsByRefs } from "./content-tags.utils"
import { remarkPluginFrontmatterSchema, type PageContent } from "./content.type"

export async function getBlogs(): Promise<PageContent[]> {
  const blogs = await getCollection("posts")
  return pageContentGeneric("post", blogs)
}

export async function getPages(): Promise<PageContent[]> {
  const pages = await getCollection("pages")
  return pageContentGeneric("page", pages)
}

export async function getFeaturedBlogs(): Promise<PageContent[]> {
  const blogs = await getBlogs()
  return blogs
    .filter((blog) => blog.featuredRank !== undefined && !blog.isDraft)
    .sort((a, b) => {
      const rankA = a.featuredRank || 0
      const rankB = b.featuredRank || 0
      return rankA - rankB // Sort in ascending order (lower rank = higher priority)
    })
}

async function pageContentGeneric(
  type: "post" | "page",
  items: CollectionEntry<"posts">[] | CollectionEntry<"pages">[],
) {
  const itemsWithContent: PageContent[] = []
  for (const item of items) {
    const { Content, remarkPluginFrontmatter } = await render(item)
    const { title, minutesRead, description, isDraft, publishedOn, pageSlug } = remarkPluginFrontmatterSchema.parse(
      remarkPluginFrontmatter,
      {
        errorMap: (error) => ({
          message: `Error parsing frontmatter for ${item.id}: ${error.message}: ${JSON.stringify(error)}`,
        }),
      },
    )
    const { lastUpdatedOn, featuredRank } = item.data
    const tags = await getTagsByRefs(item.data.tags)
    itemsWithContent.push({
      id: item.id,
      pageSlug,
      title,
      minutesRead,
      description,
      publishedOn,
      lastUpdatedOn,
      isDraft,
      ...(featuredRank !== undefined && { featuredRank }),
      tags,
      Content,
      href: type === "post" ? `/post/${pageSlug}` : `/${pageSlug}`,
      type,
    })
  }
  itemsWithContent.sort((a, b) => {
    const dateA = new Date(a.publishedOn).getTime()
    const dateB = new Date(b.publishedOn).getTime()
    return dateB - dateA
  })
  return itemsWithContent
}
