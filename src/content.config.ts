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
    featured: z.boolean().optional().default(false),
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

// Post Types (deep-dives, notes) - metadata for each post type
const postTypes = defineCollection({
  loader: file("./content/postTypes.jsonc", {
    parser: (fileContent) => parseJsonc(fileContent),
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(), // Full title for display
    name: z.string(), // Short name for navigation
    description: z.string(), // Description for listings
    href: z.string(), // URL path to the post type page
  }),
})

// Shared category schema for all content types
// Simplified 2-level structure: posts/<post-type>/<category>
// Category is derived from folder path via remark plugin
// Categories are only visible if they have at least 1 article (including drafts)
const categorySchema = z.object({
  id: z.string(),
  title: z.string(), // Full descriptive title used for h1, meta, and title attributes
  name: z.string(), // Short name used for display (footer, breadcrumbs, cards)
  description: z.string(),
})

// Unified categories collection (parses nested structure from categories.jsonc)
const categories = defineCollection({
  loader: file("./content/categories.jsonc", {
    parser: (fileContent) => {
      const parsed = parseJsonc(fileContent) as Record<string, unknown[]>
      // Flatten nested structure: { "deep-dives": [...], "notes": [...] }
      // into array with postType field and composite ID
      return Object.entries(parsed).flatMap(([postType, cats]) =>
        (cats as Array<{ id: string }>).map((cat) => ({
          ...cat,
          id: `${postType}/${cat.id}`, // e.g., "deep-dives/web-fundamentals"
          postType,
        })),
      )
    },
  }),
  schema: categorySchema.extend({
    postType: z.enum(["deep-dives", "notes"]),
  }),
})

// =============================================================================
// Content Collections - Markdown
// =============================================================================

// Shared schema for all content types
// Category is automatically injected from folder path by remark-frontmatter-plugin
// Format: content/posts/<post-type>/<category>/[optional-nesting/]<date>-<slug>.md
const baseContentSchema = z.object({
  lastReviewedOn: z.coerce.date().optional(),
  tags: z.array(z.string()).optional().default([]),
  // Category is derived from folder structure (posts/<post-type>/<category>/...)
  // Can be overridden in frontmatter if needed
  category: z.string().optional(),
  // Featured posts appear on the home page
  featured: z.boolean().optional().default(false),
})

// Unified posts collection (deep-dives and notes)
// Post type is derived from the first-level folder (deep-dives or notes)
const posts = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/posts",
  }),
  schema: baseContentSchema.extend({
    // Optional note type (only applicable for notes)
    type: z.enum(["design-doc", "architecture", "case-study"]).optional(),
  }),
})

// In-research collection (no categories, no date requirement)
// Simple flat structure: content/in-research/<slug>.md or content/in-research/<slug>/index.md
const inResearch = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./content/in-research",
  }),
  schema: z.object({
    lastReviewedOn: z.coerce.date().optional(),
    tags: z.array(z.string()).optional().default([]),
  }),
})

// =============================================================================
// Exports
// =============================================================================

export const collections = {
  posts,
  inResearch,
  categories,
  postTypes,
  tags,
  vanity,
}
