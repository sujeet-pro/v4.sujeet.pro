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
// Category Types (for Deep Dives)
// =============================================================================

export interface CategoryRef {
  id: string
  name: string
  href: string
}

export interface SubcategoryRef {
  id: string
  name: string
  href: string
}

export interface Subcategory extends SubcategoryRef {
  description: string
  deepDives: DeepDiveContent[]
}

export interface Category extends CategoryRef {
  description: string
  featured: boolean
  subcategories: Subcategory[]
  totalDeepDives: number
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
}

// Writing content (blog posts)
export interface WritingContent extends BaseContentItem {
  type: "writing"
  featuredRank?: number | undefined
}

// Deep dive content
export interface DeepDiveContent extends BaseContentItem {
  type: "deep-dive"
  category: CategoryRef
  subcategory: SubcategoryRef
}

// Work content (design docs, case studies, architecture)
export interface WorkContent extends BaseContentItem {
  type: "work"
  workType?: "design-doc" | "architecture" | "case-study" | undefined
}

// Uses content (tools, setup, productivity)
export interface UsesContent extends BaseContentItem {
  type: "uses"
}

// Union type for all content types
export type ContentItem = WritingContent | DeepDiveContent | WorkContent | UsesContent

// =============================================================================
// Content Item Types (without Content component for listings)
// =============================================================================

export type WritingContentItem = Omit<WritingContent, "Content">
export type DeepDiveContentItem = Omit<DeepDiveContent, "Content">
export type WorkContentItem = Omit<WorkContent, "Content">
export type UsesContentItem = Omit<UsesContent, "Content">

// Union type for all content item types (for listings)
export type ContentItemWithoutContent = WritingContentItem | DeepDiveContentItem | WorkContentItem | UsesContentItem

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
