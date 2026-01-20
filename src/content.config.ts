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

// Shared category schema for all content types
// Simplified 2-level structure: content-type/category (no subcategories in folder structure)
// Category is derived from folder path via remark plugin
// Categories are only visible if they have at least 1 article (including drafts)
const categorySchema = z.object({
  id: z.string(),
  title: z.string(), // Full descriptive title used for h1, meta, and title attributes
  name: z.string(), // Short name used for display (footer, breadcrumbs, cards)
  description: z.string(),
})

// Per-type category collections
const categoriesDeepDives = defineCollection({
  loader: file("./content/categories/deep-dives.jsonc", {
    parser: (fileContent) => parseJsonc(fileContent),
  }),
  schema: categorySchema,
})

const categoriesNotes = defineCollection({
  loader: file("./content/categories/notes.jsonc", {
    parser: (fileContent) => parseJsonc(fileContent),
  }),
  schema: categorySchema,
})

// =============================================================================
// Content Collections - Markdown
// =============================================================================

// Shared schema for all content types
// Category is automatically injected from folder path by remark-frontmatter-plugin
// Format: content/<content-type>/<category>/[optional-nesting/]<date>-<slug>.md
const baseContentSchema = z.object({
  lastUpdatedOn: z.coerce.date().optional(),
  tags: z.array(z.string()).optional().default([]),
  // Category is derived from folder structure (content-type/category/...)
  // Can be overridden in frontmatter if needed
  category: z.string().optional(),
})

// Deep dives collection (in-depth technical content)
const deepDives = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/deep-dives",
  }),
  schema: baseContentSchema,
})

// Notes collection (casual technical content - design docs, programming, tools, productivity)
const notes = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/notes",
  }),
  schema: baseContentSchema.extend({
    type: z.enum(["design-doc", "architecture", "case-study"]).optional(),
  }),
})

// =============================================================================
// Exports
// =============================================================================

export const collections = {
  "deep-dives": deepDives,
  notes,
  tags,
  vanity,
  // Per-type category collections
  "categories-deep-dives": categoriesDeepDives,
  "categories-notes": categoriesNotes,
}
