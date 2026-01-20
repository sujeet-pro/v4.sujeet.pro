import { z } from "astro/zod"
import type { RenderResult } from "astro:content"

// =============================================================================
// Tag Types
// =============================================================================

export interface Tag {
  id: string
  name: string // From jsonc or auto-generated
  href: string
}

// =============================================================================
// Content Type Enum
// =============================================================================

export type ContentType = "deep-dives" | "notes"

// =============================================================================
// Category Reference Types (for content items)
// =============================================================================

export interface CategoryRef {
  id: string
  title: string // Full descriptive title for h1, meta, title attributes
  name: string // Short name for display (footer, breadcrumbs, cards)
  description: string
  href: string
}

// =============================================================================
// Content Item Types
// =============================================================================

// Base content item interface shared by all content types
interface BaseContentItem {
  id: string
  pageSlug: string
  title: string
  minutesRead: string
  description: string
  publishedOn: Date
  lastUpdatedOn?: Date | undefined
  isDraft: boolean
  tags: Tag[]
  Content: RenderResult["Content"]
  href: string
  // Category derived from folder structure (content-type/category/...)
  category?: CategoryRef | undefined
}

// Deep dive content (in-depth technical)
export interface DeepDiveContent extends BaseContentItem {
  type: "deep-dive"
  // Deep dives require category
  category: CategoryRef
}

// Notes content (casual technical - design docs, programming, tools, productivity)
export interface NotesContent extends BaseContentItem {
  type: "notes"
  noteType?: "design-doc" | "architecture" | "case-study" | undefined
}

// Union type for all content types
export type ContentItem = DeepDiveContent | NotesContent

// =============================================================================
// Content Item Types (without Content component for listings)
// =============================================================================

export type DeepDiveContentItem = Omit<DeepDiveContent, "Content">
export type NotesContentItem = Omit<NotesContent, "Content">

// Union type for all content item types (for listings)
export type ContentItemWithoutContent = DeepDiveContentItem | NotesContentItem

// =============================================================================
// Category Types with Items (for category pages)
// =============================================================================

export interface CategoryWithItems<T = ContentItemWithoutContent> extends CategoryRef {
  items: T[]
}

// Legacy alias for backward compatibility
export type Category = CategoryWithItems<DeepDiveContentItem>

// =============================================================================
// Series Types
// =============================================================================

export interface Series {
  id: string
  name: string
  items: ContentItemWithoutContent[]
  featured: boolean
  href: string // Points to first item
}

// =============================================================================
// Remark Plugin Schema
// =============================================================================

export const remarkPluginFrontmatterSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
      message: "Title is required",
    })
    .min(1, "Title is required of min size 1"),
  description: z.string({ message: "Description is required" }).min(1, "Description is required"),
  minutesRead: z.string({ message: "Minutes read is required" }).min(1, "Minutes read is required"),
  publishedOn: z.coerce.date({ message: "Published on is required" }),
  isDraft: z.boolean({ message: "Is draft is required" }),
  pageSlug: z.string({ message: "Slug is required" }),
})
