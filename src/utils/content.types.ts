/**
 * Content Type Definitions
 *
 * Centralized type definitions for all content-related types.
 * This is the single source of truth for content types across the application.
 */

import { z } from "astro/zod"
import type { RenderResult } from "astro:content"

// =============================================================================
// Category and Topic Reference Types
// =============================================================================

export interface CategoryRef {
  id: string
  title: string // Full descriptive title for h1, meta, title attributes
  name: string // Short name for display (footer, breadcrumbs, cards)
  description: string
  href: string
}

export interface TopicRef {
  id: string
  title: string // Full descriptive title
  name: string // Short name for display
  description: string
  href: string
  categoryId: string // Parent category ID
}

/**
 * Topic with category already resolved (for pages that need parent context)
 */
export interface ResolvedTopic extends TopicRef {
  category: CategoryRef
}

// =============================================================================
// Index Item Types (for README.md files in category/topic folders)
// =============================================================================

// Base fields shared between CategoryIndex and TopicIndex
interface IndexItemBase {
  id: string
  pageSlug: string
  title: string
  description: string
  minutesRead: string
  isDraft: boolean
  Content: RenderResult["Content"]
  href: string
  isIndex: true
}

// Category index item (from category/README.md)
export interface CategoryIndex extends IndexItemBase {
  indexType: "category"
  category: CategoryRef // Self-reference
  topic?: undefined // Categories don't have a topic
}

// Topic index item (from category/topic/README.md)
export interface TopicIndex extends IndexItemBase {
  indexType: "topic"
  category: CategoryRef
  topic: TopicRef // Self-reference
}

// Union type for all index items
export type IndexItem = CategoryIndex | TopicIndex

// =============================================================================
// Content Item Types (for regular articles)
// =============================================================================

// Content item interface for all articles
export interface ContentItem {
  id: string
  postId: string // Slug from folder name (e.g., "sorting-algorithms")
  pageSlug: string // Full path slug (e.g., "programming/algo/sorting-algorithms")
  title: string
  minutesRead: string
  description: string
  isDraft: boolean
  Content: RenderResult["Content"]
  href: string // Full URL path (e.g., "/articles/programming/algo/sorting-algorithms")
  // Category and topic derived from folder structure
  // Structure: articles/<category>/<topic>/<post-slug>/README.md
  categoryId: string
  topicId: string
  category: CategoryRef
  topic: TopicRef
  // Index fields - always false/undefined for regular articles
  isIndex: false
  indexType?: undefined
}

// =============================================================================
// Content Item Types (without Content component for listings)
// =============================================================================

export type ContentItemWithoutContent = Omit<ContentItem, "Content">
export type IndexItemWithoutContent = Omit<IndexItem, "Content">
export type CategoryIndexWithoutContent = Omit<CategoryIndex, "Content">
export type TopicIndexWithoutContent = Omit<TopicIndex, "Content">

// =============================================================================
// Category Types with Items (for category pages)
// =============================================================================

export interface CategoryWithItems<T = ContentItemWithoutContent> extends CategoryRef {
  items: T[]
}

// Topic with items
export interface TopicWithItems<T = ContentItemWithoutContent> extends TopicRef {
  items: T[]
}

// Legacy alias for backward compatibility
export type Category = CategoryWithItems<ContentItemWithoutContent>

// =============================================================================
// Topic with Articles (hierarchical data)
// =============================================================================

/**
 * Topic with its ordered articles
 */
export interface TopicWithArticles extends TopicRef {
  articles: ContentItemWithoutContent[]
}

/**
 * Category with its topics (each with articles) and total article count
 */
export interface CategoryWithTopicsAndArticles extends CategoryRef {
  topics: TopicWithArticles[]
  articleCount: number
}

// =============================================================================
// Card Types (lightweight content for UI cards)
// =============================================================================

export interface CardLinkInfo {
  id: string
  name: string
  href: string
  title?: string
}

export interface ArticleCardInfo {
  id: string // article slug (postId)
  title: string
  description: string
  href: string
  category: CardLinkInfo
  topic: CardLinkInfo
  articleCount: number
  minutesRead?: string
  isDraft?: boolean
}

export interface TopicCardInfo {
  id: string // topic id
  title: string
  name: string
  description: string
  href: string
  category: CardLinkInfo
  articleCount: number
  articles: ArticleCardInfo[]
}

export interface CategoryCardInfo {
  id: string // category id
  title: string
  name: string
  description: string
  href: string
  topicCount: number
  articleCount: number
  topics: TopicCardInfo[]
}

export type ArticleCardCache = Record<string, ArticleCardInfo>
export type TopicCardCache = Record<string, TopicCardInfo>
export type CategoryCardCache = Record<string, CategoryCardInfo>

export interface ArticleDetailedInfo {
  article: ContentItem
  card: ArticleCardInfo
  topic: TopicCardInfo
  toc: Array<{ depth: number; slug: string; text: string }>
  prev: ArticleCardInfo | null
  next: ArticleCardInfo | null
}

// =============================================================================
// Series Types
// =============================================================================

export interface Series {
  id: string
  name: string
  items: ContentItemWithoutContent[]
  href: string // Points to first item
}

// =============================================================================
// Meta.jsonc Types
// =============================================================================

export interface CategoryMeta {
  order: string[] // Category IDs in display order
}

export interface TopicMeta {
  order: string[] // Topic IDs in display order
}

export interface ArticleMeta {
  order: string[] // Article slugs in display order
}

// =============================================================================
// Ordering Config Type (unified ordering for all content)
// =============================================================================

export interface OrderingConfig {
  // Complete lists (must include ALL items - validation ensures global uniqueness)
  categoryOrder: string[] // Category IDs in display order
  topicsOrder: string[] // All topic IDs (globally unique across categories)
  articlesOrder: string[] // All article slugs (globally unique across topics)

  // Hierarchical mappings
  categoryVsTopics: Record<string, string[]> // categoryId -> topicIds
  topicVsArticlesOrder: Record<string, string[]> // topicId -> article slugs

  // Featured subsets (for homepage)
  featuredArticles: string[] // Article slugs
  featuredTopics: string[] // Topic IDs
}

// =============================================================================
// Page Data Types (for simplified page usage)
// =============================================================================

/**
 * All data needed to render an article page
 */
export interface ArticlePageData {
  article: ContentItem
  siblingArticles: ContentItemWithoutContent[] // All articles in same topic
  prevArticle: ContentItemWithoutContent | null
  nextArticle: ContentItemWithoutContent | null
}

/**
 * All data needed to render a category page
 */
export interface CategoryPageData {
  category: CategoryRef
  index: CategoryIndex
  topics: TopicWithArticles[]
  articles: ContentItemWithoutContent[]
}

/**
 * All data needed to render a topic page
 */
export interface TopicPageData {
  topic: ResolvedTopic
  index: TopicIndex
  articles: ContentItemWithoutContent[]
}

// =============================================================================
// Content Validation Types
// =============================================================================

export interface ContentValidationError {
  type: "error" | "warning"
  path: string
  message: string
  fixable: boolean
}

export interface ContentValidationResult {
  errors: ContentValidationError[]
  warnings: ContentValidationError[]
  valid: boolean
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
  isDraft: z.boolean({ message: "Is draft is required" }),
  pageSlug: z.string({ message: "Slug is required" }),
})
