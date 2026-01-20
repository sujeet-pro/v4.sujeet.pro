import { z } from "astro/zod"
import type { RenderResult } from "astro:content"

// =============================================================================
// Tag Types
// =============================================================================

export interface Tag {
  id: string
  name: string // From jsonc or auto-generated
  href: string
  featured?: boolean // Featured tags appear on the home page
}

// =============================================================================
// Post Type and Content Type
// =============================================================================

/** Post type represents the first-level folder under posts/ */
export type PostType = "deep-dives" | "notes"

/** Content type alias for backward compatibility */
export type ContentType = PostType

/** Collection type includes all content collections */
export type CollectionType = PostType | "in-research"

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
  lastReviewedOn?: Date | undefined
  isDraft: boolean
  tags: Tag[]
  Content: RenderResult["Content"]
  href: string
  // Post type derived from folder structure (posts/<post-type>/...)
  postType: PostType
  // Category derived from folder structure (posts/<post-type>/<category>/...)
  category?: CategoryRef | undefined
  // Featured posts appear on the home page
  featured: boolean
}

// Deep dive content (in-depth technical)
export interface DeepDiveContent extends BaseContentItem {
  postType: "deep-dives"
  type: "deep-dive"
  // Deep dives require category
  category: CategoryRef
}

// Notes content (casual technical - design docs, programming, tools, productivity)
export interface NotesContent extends BaseContentItem {
  postType: "notes"
  type: "notes"
  noteType?: "design-doc" | "architecture" | "case-study" | undefined
}

// Union type for all content types
export type ContentItem = DeepDiveContent | NotesContent

// =============================================================================
// In-Research Content Types (no date, no categories)
// =============================================================================

// Base interface for in-research content (no publishedOn required)
interface BaseInResearchItem {
  id: string
  pageSlug: string
  title: string
  minutesRead: string
  description: string
  lastReviewedOn?: Date | undefined
  isDraft: boolean
  tags: Tag[]
  Content: RenderResult["Content"]
  href: string
}

// In-research content (work in progress, no publish date)
export interface InResearchContent extends BaseInResearchItem {
  collectionType: "in-research"
  type: "in-research"
}

// =============================================================================
// Content Item Types (without Content component for listings)
// =============================================================================

export type DeepDiveContentItem = Omit<DeepDiveContent, "Content">
export type NotesContentItem = Omit<NotesContent, "Content">
export type InResearchContentItem = Omit<InResearchContent, "Content">

// Union type for all content item types (for listings)
export type ContentItemWithoutContent = DeepDiveContentItem | NotesContentItem

// Union type for in-research content items (for listings)
export type InResearchContentItemWithoutContent = InResearchContentItem

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

// Schema for in-research content (no publishedOn required)
export const inResearchFrontmatterSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
      message: "Title is required",
    })
    .min(1, "Title is required of min size 1"),
  description: z.string({ message: "Description is required" }).min(1, "Description is required"),
  minutesRead: z.string({ message: "Minutes read is required" }).min(1, "Minutes read is required"),
  isDraft: z.boolean({ message: "Is draft is required" }),
  pageSlug: z.string({ message: "Slug is required" }),
})
