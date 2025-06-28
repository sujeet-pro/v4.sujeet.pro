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
    const { title, minutesRead } = remarkPluginFrontmatterSchema.parse(remarkPluginFrontmatter);
    const { description, publishedOn, lastUpdatedOn, isDraft } = item.data;
    const tags = await getTagsByRefs(item.data.tags);
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
      href: type === "blog" ? `/blog/${item.id}` : `/${item.id}`,
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
