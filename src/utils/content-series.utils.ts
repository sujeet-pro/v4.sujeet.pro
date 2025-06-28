import { getCollection } from "astro:content";
import { getBlogs } from "./content-blogs.utils";
import type { PageContent, Series } from "./content.type";

export async function getAllSeries(): Promise<Series[]> {
  const seriesCollection = await getCollection("series");
  const allBlogs = await getBlogs();
  const blogsById = new Map<string, PageContent>(allBlogs.map((blog) => [blog.id, blog]));

  const seriesWithBlogs = seriesCollection.map((series) => {
    const blogIds = series.data.blogs;
    const blogs = blogIds.map((blogId) => {
      const blog = blogsById.get(blogId);
      if (!blog) {
        throw new Error(`Blog with id ${blogId} not found in series ${series.id}`);
      }
      return blog;
    });
    return {
      id: series.id,
      name: series.data.name,
      blogs,
      href: `/series/${series.id}`,
    };
  });

  return seriesWithBlogs;
}
