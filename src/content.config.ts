import { file, glob } from "astro/loaders";
import { defineCollection, reference, z } from "astro:content";
import json5 from "json5";

const tags = defineCollection({
  loader: file("./content/tags.json5", {
    parser: (fileContent) => json5.parse(fileContent),
  }),
  schema: z.object({
    name: z.string(),
  }),
});

const vanity = defineCollection({
  loader: file("./content/vanity.json5", {
    parser: (fileContent) => json5.parse(fileContent),
  }),
  schema: z.object({
    target: z.string().url(),
  }),
});

const contentSchema = z.object({
  description: z.string(),
  publishedOn: z.date(),
  lastUpdatedOn: z.date(),
  isDraft: z.boolean().default(false),
  tags: z.array(reference("tags")),
});

const blogs = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/blogs",
  }),
  schema: contentSchema,
});

const pages = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/pages",
  }),
  schema: contentSchema,
});

export const collections = {
  blogs,
  pages,
  tags,
  vanity,
};
export type ContentSchema = z.infer<typeof contentSchema>;
