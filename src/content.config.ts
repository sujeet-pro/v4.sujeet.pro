import { file, glob } from "astro/loaders"
import { defineCollection, z } from "astro:content"
import JSON5 from "json5"

// =============================================================================
// JSON5 Parser Type
// =============================================================================

type Json5Result = Record<string, Record<string, unknown>> | Record<string, unknown>[]

// =============================================================================
// JSONC Config Collections
// =============================================================================

// Vanity URLs - supports both external URLs and internal redirects (starting with /)
const vanity = defineCollection({
  loader: file("./content/vanity.json5", {
    parser: (fileContent) => JSON5.parse(fileContent) as Json5Result,
  }),
  schema: z.object({
    id: z.string(),
    target: z.string(), // URL or internal path starting with /
  }),
})

// Home Page Configuration
const home = defineCollection({
  loader: file("./content/home.json5", {
    parser: (fileContent) => {
      const data = JSON5.parse(fileContent) as Record<string, unknown>
      // Wrap in array with id for Astro collection format
      return [{ id: "home", ...data }]
    },
  }),
  schema: z.object({
    id: z.string(),
    pageTitle: z.string(),
    pageDescription: z.string(),
    profile: z.object({
      name: z.string(),
      title: z.string(),
      bio: z.string(),
      imageAlt: z.string(),
    }),
    profileActions: z.object({
      linkedin: z.string(),
      viewCv: z.string(),
      randomArticle: z.string(),
      allArticles: z.string(),
    }),
  }),
})

// Site Configuration
const site = defineCollection({
  loader: file("./content/site.json5", {
    parser: (fileContent) => {
      const data = JSON5.parse(fileContent) as Record<string, unknown>
      // Wrap in array with id for Astro collection format
      return [{ id: "site", ...data }]
    },
  }),
  schema: z.object({
    id: z.string(),
    origin: z.string(),
    name: z.string(),
    title: z.string(),
    description: z.string(),
    language: z.string(),
    locale: z.string(),
    navItems: z.array(
      z.object({
        path: z.string(),
        label: z.string(),
      }),
    ),
    footerLinks: z.array(
      z.object({
        path: z.string(),
        label: z.string(),
      }),
    ),
    social: z.object({
      twitter: z.object({
        handle: z.string(),
        url: z.string(),
      }),
      github: z.object({
        handle: z.string(),
        url: z.string(),
      }),
      linkedin: z.object({
        handle: z.string(),
        url: z.string(),
      }),
    }),
    copyright: z.object({
      holder: z.string(),
      startYear: z.number(),
    }),
  }),
})

// Unified Ordering Configuration
// Hierarchical structure: categories -> topics -> articles
// Order is determined by array position at each level
const ordering = defineCollection({
  loader: file("./content/ordering.json5", {
    parser: (fileContent) => {
      const data = JSON5.parse(fileContent) as Record<string, unknown>
      // Wrap in array with id for Astro collection format
      return [{ id: "ordering", ...data }]
    },
  }),
  schema: z.object({
    id: z.string(),
    // Hierarchical structure
    categories: z.array(
      z.object({
        id: z.string(),
        topics: z.array(
          z.object({
            id: z.string(),
            articles: z.array(z.string()),
          }),
        ),
      }),
    ),
    // Featured subsets (for homepage)
    featuredArticles: z.array(z.string()), // IDs from 'article' collection
    featuredTopics: z.array(z.string()), // IDs from 'topic' collection
    // Project ordering
    projects: z.array(z.string()).optional().default([]),
    // Pinned content (shown first on listing pages)
    pinnedArticles: z.array(z.string()).optional().default([]),
    pinnedBlogs: z.array(z.string()).optional().default([]),
    pinnedProjects: z.array(z.string()).optional().default([]),
  }),
})

// =============================================================================
// Content Collections - Categories, Topics, and Articles
// =============================================================================

// Structure:
// - Categories: content/articles/<category>/README.md
// - Topics: content/articles/<category>/<topic>/README.md
// - Articles: content/articles/<category>/<topic>/<article>/README.md

// Category collection - top-level content groupings
// ID format: "programming", "sys-design", etc. (folder name only)
const category = defineCollection({
  loader: glob({
    pattern: "*/README.md",
    base: "./content/articles",
    generateId: ({ entry }) => {
      // entry is like "programming/README.md" -> extract "programming"
      return entry.split("/")[0] ?? entry
    },
  }),
  schema: z.object({}),
})

// Topic collection - sub-categories within a category
// ID format: "algo", "js-patterns", etc. (folder name only)
const topic = defineCollection({
  loader: glob({
    pattern: "*/*/README.md",
    base: "./content/articles",
    generateId: ({ entry }) => {
      // entry is like "programming/algo/README.md" -> extract "algo"
      return entry.split("/")[1] ?? entry
    },
  }),
  schema: z.object({
    // Category is derived from folder structure
    category: z.string().optional(),
  }),
})

// Article collection - individual blog posts
// ID format: "sorting-algorithms", "k-crystal-balls", etc. (folder name only)
const article = defineCollection({
  loader: glob({
    pattern: "*/*/*/README.md",
    base: "./content/articles",
    generateId: ({ entry }) => {
      // entry is like "programming/algo/sorting-algorithms/README.md" -> extract "sorting-algorithms"
      return entry.split("/")[2] ?? entry
    },
  }),
  schema: z.object({
    // Category and topic are derived from folder structure
    category: z.string().optional(),
    topic: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
  }),
})

// Blog collection - standalone blog posts (not in category/topic hierarchy)
// Structure: content/blogs/<blog-slug>/README.md
const blog = defineCollection({
  loader: glob({
    pattern: "*/README.md",
    base: "./content/blogs",
    generateId: ({ entry }) => {
      // entry is like "my-blog-post/README.md" -> extract "my-blog-post"
      return entry.split("/")[0] ?? entry
    },
  }),
  schema: z.object({
    publishedOn: z.string().optional(),
    lastUpdatedOn: z.string().optional(),
    archived: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
  }),
})

// Project collection - project showcase pages
// Structure: content/projects/<project-slug>/README.md
const project = defineCollection({
  loader: glob({
    pattern: "*/README.md",
    base: "./content/projects",
    generateId: ({ entry }) => {
      // entry is like "my-project/README.md" -> extract "my-project"
      return entry.split("/")[0] ?? entry
    },
  }),
  schema: z.object({
    gitRepo: z.string().optional(),
    demoUrl: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
  }),
})

// =============================================================================
// Exports
// =============================================================================

export const collections = {
  category,
  topic,
  article,
  blog,
  project,
  vanity,
  home,
  site,
  ordering,
}
