import { getCollection, render, z, type ReferenceDataEntry, type RenderResult } from "astro:content";

export async function getTagsByRefs(refs: ReferenceDataEntry<"tags">[]) {
  const tagsCollection = await getCollection("tags");
  const validTagIds = new Set(refs.map((ref) => ref.id));
  const tags = tagsCollection.filter((tag) => validTagIds.has(tag.id)).map((tag) => tag.data.name);
  if (tags.length !== validTagIds.size) {
    const invalidTagIds = Array.from(validTagIds).filter((id) => !tags.includes(id));
    throw new Error(`Invalid tag IDs: ${invalidTagIds.join(", ")}`);
  }
  return tags;
}

interface BlogContent {
  id: string;
  title: string;
  minutesRead: string;
  description: string;
  publishedOn: Date;
  lastUpdatedOn: Date;
  isDraft: boolean;
  tags: string[];
  Content: RenderResult["Content"];
}
const remarkPluginFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required, check plugin for auto-generation. Ensure content has level 1 heading"),
  minutesRead: z.string().min(1, "Minutes read is required"),
});

export async function getBlogs(): Promise<BlogContent[]> {
  const blogs = await getCollection("blogs");
  const blogsWithContent: BlogContent[] = [];
  for (const blog of blogs) {
    const { Content, remarkPluginFrontmatter } = await render(blog);
    const { title, minutesRead } = remarkPluginFrontmatterSchema.parse(remarkPluginFrontmatter);
    const { description, publishedOn, lastUpdatedOn, isDraft } = blog.data;
    const tags = await getTagsByRefs(blog.data.tags);
    blogsWithContent.push({
      id: blog.id,
      title,
      minutesRead,
      description,
      publishedOn,
      lastUpdatedOn,
      isDraft,
      tags,
      Content,
    });
  }
  // Sort by published date (newest first)
  blogsWithContent.sort((a, b) => {
    const dateA = new Date(a.publishedOn).getTime();
    const dateB = new Date(b.publishedOn).getTime();
    return dateB - dateA;
  });

  return blogsWithContent;
}
