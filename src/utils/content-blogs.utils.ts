import { getCollection, render, type CollectionEntry } from "astro:content";
import { getTagsByRefs } from "./content-tags.utils";
import { remarkPluginFrontmatterSchema, type PageContent } from "./content.type";

export async function getBlogs(): Promise<PageContent[]> {
  const blogs = await getCollection("blogs");
  return pageContentGeneric("blog", blogs);
}

export async function getPages(): Promise<PageContent[]> {
  const pages = await getCollection("pages");
  return pageContentGeneric("page", pages);
}

async function pageContentGeneric(
  type: "blog" | "page",
  items: CollectionEntry<"blogs">[] | CollectionEntry<"pages">[],
) {
  const itemsWithContent: PageContent[] = [];
  for (const item of items) {
    const { Content, remarkPluginFrontmatter } = await render(item);
    const { title, minutesRead, description, isDraft, publishedOn } = remarkPluginFrontmatterSchema.parse(
      remarkPluginFrontmatter,
      {
        errorMap: (error) => ({
          message: `Error parsing frontmatter for ${item.id}: ${error.message}: ${JSON.stringify(error)}`,
        }),
      },
    );
    const { lastUpdatedOn } = item.data;
    const tags = await getTagsByRefs(item.data.tags);
    let itemId = item.id;
    // Remove the YYYY-MM-DD/ prefix from itemId
    const datePattern = /^\d{4}-\d{2}-\d{2}\//;
    itemId = item.id.replace(datePattern, "");
    itemsWithContent.push({
      id: item.id,
      title,
      minutesRead,
      description,
      publishedOn,
      lastUpdatedOn,
      isDraft,
      tags,
      Content,
      href: type === "blog" ? `/blog/${itemId}` : `/${itemId}`,
      type,
    });
  }
  itemsWithContent.sort((a, b) => {
    const dateA = new Date(a.publishedOn).getTime();
    const dateB = new Date(b.publishedOn).getTime();
    return dateB - dateA;
  });
  return itemsWithContent;
}
