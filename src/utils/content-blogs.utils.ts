import { getCollection, render, type CollectionEntry } from "astro:content";
import { getTagsByRefs } from "./content-tags.utils";
import { remarkPluginFrontmatterSchema, type PageContent } from "./content.type";

export async function getBlogs(): Promise<PageContent[]> {
  const blogs = await getCollection("posts");
  return pageContentGeneric("post", blogs);
}

export async function getPages(): Promise<PageContent[]> {
  const pages = await getCollection("pages");
  return pageContentGeneric("page", pages);
}

async function pageContentGeneric(
  type: "post" | "page",
  items: CollectionEntry<"posts">[] | CollectionEntry<"pages">[],
) {
  const itemsWithContent: PageContent[] = [];
  for (const item of items) {
    const { Content, remarkPluginFrontmatter } = await render(item);
    const { title, minutesRead, description, isDraft, publishedOn, slug } = remarkPluginFrontmatterSchema.parse(
      remarkPluginFrontmatter,
      {
        errorMap: (error) => ({
          message: `Error parsing frontmatter for ${item.id}: ${error.message}: ${JSON.stringify(error)}`,
        }),
      },
    );
    const { lastUpdatedOn } = item.data;
    const tags = await getTagsByRefs(item.data.tags);
    itemsWithContent.push({
      id: item.id,
      slug,
      title,
      minutesRead,
      description,
      publishedOn,
      lastUpdatedOn,
      isDraft,
      tags,
      Content,
      href: type === "post" ? `/post/${slug}` : `/${slug}`,
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
