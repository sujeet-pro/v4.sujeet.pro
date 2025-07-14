import { file, glob } from "astro/loaders"
import { defineCollection, reference, z } from "astro:content"
import json5 from "json5"

const tags = defineCollection({
  loader: file("./content/tags.json5", {
    parser: (fileContent) => json5.parse(fileContent),
  }),
  schema: z.object({
    name: z.string(),
  }),
})

const vanity = defineCollection({
  loader: file("./content/vanity.json5", {
    parser: (fileContent) => json5.parse(fileContent),
  }),
  schema: z.object({
    target: z.string().url(),
  }),
})

const series = defineCollection({
  loader: file("./content/series.json5", {
    parser: (fileContent) => {
      const data = json5.parse(fileContent)
      return data
    },
  }),
  schema: z.object({
    name: z.string(),
    blogs: z.array(z.string()),
  }),
})

const contentSchema = z.object({
  lastUpdatedOn: z.date(),
  tags: z.array(reference("tags")),
  featuredRank: z.number().optional(),
})

const posts = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/posts",
  }),
  schema: contentSchema,
})

const pages = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/pages",
  }),
  schema: contentSchema,
})

export const collections = {
  posts,
  pages,
  tags,
  vanity,
  series,
}
