import { getCollection } from "astro:content"
import { getBlogs } from "./content-blogs.utils"
import type { PageContent, Series } from "./content.type"

export async function getAllSeries(): Promise<Series[]> {
  const seriesCollection = await getCollection("series")
  const allBlogs = await getBlogs()
  const blogsById = new Map<string, PageContent>(allBlogs.map((blog) => [blog.id, blog]))

  // Each series item is treated as a separate collection entry
  const seriesWithBlogs = seriesCollection.map((series) => {
    const blogIds = series.data.blogs
    const blogs = blogIds.map((blogId: string) => {
      const blog = blogsById.get(blogId)
      if (!blog) {
        throw new Error(`Blog with id ${blogId} not found in series ${series.id}`)
      }
      return blog
    })
    return {
      id: series.id,
      name: series.data.name,
      blogs,
      featured: series.data.featured,
      href: `/series/${series.id}`,
    }
  })

  return seriesWithBlogs
}

export async function getFeaturedSeries(): Promise<Series[]> {
  const allSeries = await getAllSeries()
  return allSeries.filter((series) => series.featured)
}
