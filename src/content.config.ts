import { file, glob } from "astro/loaders"
import { defineCollection, z } from "astro:content"

// =============================================================================
// JSONC Parser (JSON with Comments)
// =============================================================================

type JsoncResult = Record<string, Record<string, unknown>> | Record<string, unknown>[]

function parseJsonc(content: string): JsoncResult {
  // Remove comments while preserving strings containing //
  // Match strings first to skip them, then match comments to remove
  const cleaned = content.replace(/"(?:[^"\\]|\\.)*"|\/\/[^\n]*|\/\*[\s\S]*?\*/g, (match) => {
    // If it's a string (starts with "), keep it
    if (match.startsWith('"')) return match
    // Otherwise it's a comment, remove it
    return ""
  })
  // Remove trailing commas
  const noTrailingCommas = cleaned.replace(/,(\s*[}\]])/g, "$1")
  return JSON.parse(noTrailingCommas) as JsoncResult
}

// =============================================================================
// JSONC Config Collections
// =============================================================================

// Tags config (optional display names - tags can exist without being in this file)
const tags = defineCollection({
  loader: file("./content/tags.jsonc", {
    parser: (fileContent) => parseJsonc(fileContent),
  }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

// Vanity URLs
const vanity = defineCollection({
  loader: file("./content/vanity.jsonc", {
    parser: (fileContent) => parseJsonc(fileContent),
  }),
  schema: z.object({
    id: z.string(),
    target: z.string().url(),
  }),
})

// Series config - items array can reference any content type
const series = defineCollection({
  loader: file("./content/series.jsonc", {
    parser: (fileContent) => parseJsonc(fileContent),
  }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    items: z.array(z.string()), // Array of content IDs (any type)
    featured: z.boolean().optional().default(false),
  }),
})

// Deep dive categories
const categories = defineCollection({
  loader: file("./content/categories.jsonc", {
    parser: (fileContent) => parseJsonc(fileContent),
  }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    featured: z.boolean().optional().default(false),
    subcategories: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
      }),
    ),
  }),
})

// =============================================================================
// Content Collections - Markdown
// =============================================================================

// Shared schema for all content types
const baseContentSchema = z.object({
  lastUpdatedOn: z.coerce.date().optional(),
  tags: z.array(z.string()).optional().default([]),
  series: z.string().optional(), // series ID if part of a series
})

// Writing collection (replaces posts)
const writing = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/writing",
  }),
  schema: baseContentSchema.extend({
    featuredRank: z.number().optional(),
  }),
})

// Deep dives collection
const deepDives = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/deep-dives",
  }),
  schema: baseContentSchema.extend({
    subcategory: z.string(), // Format: "category/subcategory"
  }),
})

// Work collection (design docs, case studies)
const work = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/work",
  }),
  schema: baseContentSchema.extend({
    type: z.enum(["design-doc", "architecture", "case-study"]).optional(),
  }),
})

// Uses collection (tools, setup, productivity)
const uses = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/uses",
  }),
  schema: baseContentSchema,
})

// =============================================================================
// Exports
// =============================================================================

export const collections = {
  writing,
  "deep-dives": deepDives,
  work,
  uses,
  tags,
  series,
  vanity,
  categories,
}
