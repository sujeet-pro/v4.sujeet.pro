/**
 * Content Core Module (Internal)
 *
 * This module contains internal content processing logic.
 * It is NOT exported to pages - use content.ts for the public API.
 *
 * ## Architecture
 * - processAllContent(): Main processor for all articles and index files
 * - Ordering utilities: Access to ordering.json5 configuration
 * - Draft utilities: Filter drafts based on environment
 *
 * ## Structure
 * - content/articles/<category>/README.md (category index)
 * - content/articles/<category>/<topic>/README.md (topic index)
 * - content/articles/<category>/<topic>/<post-slug>/README.md (articles)
 */

import { getCollection, render } from "astro:content"
import { parseFrontmatter } from "./content.helpers"
import type {
  CategoryIndex,
  CategoryRef,
  ContentItem,
  ContentItemWithoutContent,
  DerivedOrdering,
  IndexItem,
  OrderingConfig,
  TopicIndex,
  TopicRef,
} from "./content.types"

// =============================================================================
// Internal Types
// =============================================================================

export interface ProcessedContent {
  articles: ContentItem[]
  articlesWithoutContent: ContentItemWithoutContent[]
  indexItems: IndexItem[]
  categoryLookup: Map<string, CategoryRef>
  topicLookup: Map<string, TopicRef>
  categoryOrder: string[]
  topicOrder: Map<string, string[]> // categoryId -> topic order
  articleOrder: Map<string, string[]> // topicId -> article order
}

// =============================================================================
// Draft Utilities
// =============================================================================

/**
 * Check if draft content should be visible.
 * Drafts are shown in development mode.
 */
export function shouldShowDrafts(): boolean {
  return import.meta.env.DEV
}

/**
 * Filter out draft items based on draft visibility settings.
 */
export function filterDrafts<T extends { isDraft: boolean }>(items: T[]): T[] {
  if (shouldShowDrafts()) {
    return items
  }
  return items.filter((item) => !item.isDraft)
}

// =============================================================================
// Ordering Utilities
// =============================================================================

let cachedOrdering: OrderingConfig | null = null
let cachedDerivedOrdering: DerivedOrdering | null = null

/**
 * Get the full ordering configuration from ordering.json5
 */
export async function getOrdering(): Promise<OrderingConfig> {
  if (!cachedOrdering) {
    const orderingCollection = await getCollection("ordering")
    const orderingData = orderingCollection[0]
    if (!orderingData) {
      throw new Error("ordering.json5 not found or empty")
    }
    cachedOrdering = {
      categories: orderingData.data.categories,
      featuredArticles: orderingData.data.featuredArticles,
      featuredTopics: orderingData.data.featuredTopics,
    }
  }
  return cachedOrdering
}

/**
 * Derive flat ordering lists from hierarchical structure
 */
export async function getDerivedOrdering(): Promise<DerivedOrdering> {
  if (!cachedDerivedOrdering) {
    const ordering = await getOrdering()

    const categoryOrder: string[] = []
    const topicsOrder: string[] = []
    const articlesOrder: string[] = []
    const categoryVsTopics: Record<string, string[]> = {}
    const topicVsArticlesOrder: Record<string, string[]> = {}

    for (const category of ordering.categories) {
      categoryOrder.push(category.id)
      const topicIds: string[] = []

      for (const topic of category.topics) {
        topicIds.push(topic.id)
        topicsOrder.push(topic.id)
        topicVsArticlesOrder[topic.id] = topic.articles
        articlesOrder.push(...topic.articles)
      }

      categoryVsTopics[category.id] = topicIds
    }

    cachedDerivedOrdering = {
      categoryOrder,
      topicsOrder,
      articlesOrder,
      categoryVsTopics,
      topicVsArticlesOrder,
    }
  }
  return cachedDerivedOrdering
}

/**
 * Get the display order of categories
 */
export async function getCategoryOrderFromConfig(): Promise<string[]> {
  const derived = await getDerivedOrdering()
  return derived.categoryOrder
}

/**
 * Get the global list of all topics in display order
 */
export async function getTopicsOrderFromConfig(): Promise<string[]> {
  const derived = await getDerivedOrdering()
  return derived.topicsOrder
}

/**
 * Get topics for a specific category in display order
 */
export async function getTopicsForCategoryFromConfig(categoryId: string): Promise<string[]> {
  const derived = await getDerivedOrdering()
  return derived.categoryVsTopics[categoryId] ?? []
}

/**
 * Get the global list of all articles in display order
 */
export async function getArticlesOrderFromConfig(): Promise<string[]> {
  const derived = await getDerivedOrdering()
  return derived.articlesOrder
}

/**
 * Get articles for a specific topic in display order
 */
export async function getArticlesForTopicFromConfig(topicId: string): Promise<string[]> {
  const derived = await getDerivedOrdering()
  return derived.topicVsArticlesOrder[topicId] ?? []
}

/**
 * Get featured article slugs for homepage
 */
export async function getFeaturedArticleSlugs(): Promise<string[]> {
  const ordering = await getOrdering()
  return ordering.featuredArticles
}

/**
 * Get featured topic IDs for homepage
 */
export async function getFeaturedTopicIds(): Promise<string[]> {
  const ordering = await getOrdering()
  return ordering.featuredTopics
}

// =============================================================================
// Sorting Utilities
// =============================================================================

/**
 * Sort items by an ordering array.
 * Items not in the order array are placed at the end.
 */
export function sortByOrdering<T>(items: T[], order: string[], getId: (item: T) => string): T[] {
  if (order.length === 0) return items

  const orderMap = new Map(order.map((id, idx) => [id, idx]))

  return [...items].sort((a, b) => {
    const aIdx = orderMap.get(getId(a)) ?? Infinity
    const bIdx = orderMap.get(getId(b)) ?? Infinity
    return aIdx - bIdx
  })
}

/**
 * Sort items with an `id` property by an ordering array
 */
export function sortByOrderingWithId<T extends { id: string }>(items: T[], order: string[]): T[] {
  return sortByOrdering(items, order, (item) => item.id)
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Extract category and topic IDs from file path
 */
function extractIdsFromFilePath(filePath: string): {
  categoryId: string
  topicId?: string
  postId?: string
} {
  const parts = filePath.replace("/README.md", "").split("/")
  const categoryId = parts[0] ?? ""
  const topicId = parts[1]
  const postId = parts[2]

  if (parts.length === 1) {
    return { categoryId }
  }
  if (parts.length === 2 && topicId) {
    return { categoryId, topicId }
  }
  if (parts.length === 3 && topicId && postId) {
    return { categoryId, topicId, postId }
  }

  return { categoryId }
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate content structure and throw build errors for issues
 */
function validateContentStructure(
  articles: ContentItem[],
  categoryLookup: Map<string, CategoryRef>,
  topicLookup: Map<string, TopicRef>,
  categoryOrder: string[],
  topicOrder: Map<string, string[]>,
  articleOrder: Map<string, string[]>,
): void {
  const errors: string[] = []

  // Track all slugs for uniqueness validation
  const allSlugs = new Set<string>()

  // Validate categories are in order
  for (const [categoryId] of categoryLookup) {
    if (!categoryOrder.includes(categoryId)) {
      errors.push(`Category "${categoryId}" is missing from ordering.json5 categoryOrder`)
    }
  }

  // Validate topics are in order
  for (const [topicKey, topicRef] of topicLookup) {
    const categoryId = topicKey.split("/")[0] ?? ""
    const order = topicOrder.get(categoryId) ?? []
    if (!order.includes(topicRef.id)) {
      errors.push(`Topic "${topicRef.id}" is missing from ordering.json5 categoryVsTopics["${categoryId}"]`)
    }
  }

  // Validate articles and check slug uniqueness
  for (const article of articles) {
    const order = articleOrder.get(article.topicId) ?? []
    if (!order.includes(article.postId)) {
      errors.push(
        `Article "${article.postId}" is missing from ordering.json5 topicVsArticlesOrder["${article.topicId}"]`,
      )
    }

    // Check category slug uniqueness
    if (allSlugs.has(article.categoryId)) {
      // This is expected - categories are reused
    } else {
      allSlugs.add(article.categoryId)
    }

    // Check global uniqueness of post slugs
    if (allSlugs.has(article.postId)) {
      errors.push(`Duplicate article slug: "${article.postId}" is not globally unique`)
    } else {
      allSlugs.add(article.postId)
    }
  }

  // Also add category and topic IDs to check for conflicts
  for (const categoryId of categoryLookup.keys()) {
    if (allSlugs.has(categoryId) && !categoryLookup.has(categoryId)) {
      errors.push(`Category slug "${categoryId}" conflicts with an article slug`)
    }
  }

  for (const [, topicRef] of topicLookup) {
    if (allSlugs.has(topicRef.id) && !categoryLookup.has(topicRef.id) && !topicLookup.has(topicRef.id)) {
      errors.push(`Topic slug "${topicRef.id}" conflicts with an article slug`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`)
  }
}

/**
 * Sort articles according to ordering.json5 order
 */
function sortArticlesByOrdering(articles: ContentItem[], articleOrder: Map<string, string[]>): ContentItem[] {
  return [...articles].sort((a, b) => {
    // Different topics - maintain original order
    if (a.topicId !== b.topicId) {
      return 0
    }

    // Same topic - use ordering.json5 order
    const order = articleOrder.get(a.topicId) ?? []
    const indexA = order.indexOf(a.postId)
    const indexB = order.indexOf(b.postId)

    const effectiveA = indexA === -1 ? order.length : indexA
    const effectiveB = indexB === -1 ? order.length : indexB

    return effectiveA - effectiveB
  })
}

/**
 * Strip Content component from article
 */
function stripContent(article: ContentItem): ContentItemWithoutContent {
  const { Content: _, ...rest } = article
  return rest
}

// =============================================================================
// Content Processing
// =============================================================================

/**
 * Process all content from the separate category, topic, and article collections.
 * Builds lookups and processes all content items.
 */
async function processAllContent(): Promise<ProcessedContent> {
  // Get all collections
  const categoryItems = await getCollection("category")
  const topicItems = await getCollection("topic")
  const articleItems = await getCollection("article")

  const categoryLookup = new Map<string, CategoryRef>()
  const topicLookup = new Map<string, TopicRef>()
  const indexItems: IndexItem[] = []
  const articles: ContentItem[] = []

  // Load ordering from ordering.json5
  const categoryOrder = await getCategoryOrderFromConfig()
  const topicOrder = new Map<string, string[]>()
  const articleOrder = new Map<string, string[]>()

  // Load topic and article ordering from ordering.json5
  for (const categoryId of categoryOrder) {
    const topics = await getTopicsForCategoryFromConfig(categoryId)
    topicOrder.set(categoryId, topics)

    for (const topicId of topics) {
      const articlesForTopic = await getArticlesForTopicFromConfig(topicId)
      articleOrder.set(topicId, articlesForTopic)
    }
  }

  // Process categories
  for (const item of categoryItems) {
    const categoryId = item.id
    const { Content, remarkPluginFrontmatter } = await render(item)
    const frontmatter = parseFrontmatter(remarkPluginFrontmatter, item.id)
    const name = frontmatter.title

    const categoryRef: CategoryRef = {
      id: categoryId,
      title: frontmatter.title,
      name,
      description: frontmatter.description,
      href: `/articles/${categoryId}`,
    }
    categoryLookup.set(categoryId, categoryRef)

    const categoryIndex: CategoryIndex = {
      id: item.id,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      description: frontmatter.description,
      minutesRead: frontmatter.minutesRead,
      isDraft: frontmatter.isDraft,
      Content,
      href: `/articles/${categoryId}`,
      isIndex: true,
      indexType: "category",
      category: categoryRef,
    }
    indexItems.push(categoryIndex)
  }

  // Process topics
  for (const item of topicItems) {
    const topicId = item.id
    const filePath = item.filePath ?? ""
    const { categoryId } = extractIdsFromFilePath(filePath.replace("content/articles/", ""))
    const { Content, remarkPluginFrontmatter } = await render(item)
    const frontmatter = parseFrontmatter(remarkPluginFrontmatter, item.id)
    const name = frontmatter.title

    let categoryRef = categoryLookup.get(categoryId)
    if (!categoryRef) {
      categoryRef = {
        id: categoryId,
        title: categoryId,
        name: categoryId,
        description: "",
        href: `/articles/${categoryId}`,
      }
      categoryLookup.set(categoryId, categoryRef)
    }

    const topicRef: TopicRef = {
      id: topicId,
      title: frontmatter.title,
      name,
      description: frontmatter.description,
      href: `/articles/${categoryId}/${topicId}`,
      categoryId,
    }
    topicLookup.set(`${categoryId}/${topicId}`, topicRef)

    const topicIndex: TopicIndex = {
      id: item.id,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      description: frontmatter.description,
      minutesRead: frontmatter.minutesRead,
      isDraft: frontmatter.isDraft,
      Content,
      href: `/articles/${categoryId}/${topicId}`,
      isIndex: true,
      indexType: "topic",
      category: categoryRef,
      topic: topicRef,
    }
    indexItems.push(topicIndex)
  }

  // Process articles
  for (const item of articleItems) {
    const postId = item.id
    const filePath = item.filePath ?? ""
    const { categoryId, topicId } = extractIdsFromFilePath(filePath.replace("content/articles/", ""))
    const { Content, remarkPluginFrontmatter } = await render(item)
    const frontmatter = parseFrontmatter(remarkPluginFrontmatter, item.id)

    if (!topicId) {
      throw new Error(`Article must be in a topic folder: ${filePath}`)
    }

    const categoryRef = categoryLookup.get(categoryId)
    if (!categoryRef) {
      throw new Error(`Invalid category: ${categoryId} for ${filePath}. Missing README.md?`)
    }

    const topicKey = `${categoryId}/${topicId}`
    const topicRef = topicLookup.get(topicKey)
    if (!topicRef) {
      throw new Error(`Invalid topic: ${topicId} in category ${categoryId} for ${filePath}. Missing README.md?`)
    }

    articles.push({
      id: item.id,
      postId,
      pageSlug: frontmatter.pageSlug,
      title: frontmatter.title,
      minutesRead: frontmatter.minutesRead,
      description: frontmatter.description,
      isDraft: frontmatter.isDraft,
      Content,
      href: `/articles/${frontmatter.pageSlug}`,
      categoryId,
      topicId,
      category: categoryRef,
      topic: topicRef,
      isIndex: false,
    })
  }

  // Validate content structure
  validateContentStructure(articles, categoryLookup, topicLookup, categoryOrder, topicOrder, articleOrder)

  // Sort articles by ordering.json5 order
  const sortedArticles = sortArticlesByOrdering(articles, articleOrder)

  // Create articles without content for listings
  const articlesWithoutContent = sortedArticles.map(stripContent)

  return {
    articles: sortedArticles,
    articlesWithoutContent,
    indexItems,
    categoryLookup,
    topicLookup,
    categoryOrder,
    topicOrder,
    articleOrder,
  }
}

// =============================================================================
// Cached Results
// =============================================================================

let cachedContent: ProcessedContent | null = null

/**
 * Get processed content (cached)
 */
export async function getProcessedContent(): Promise<ProcessedContent> {
  if (!cachedContent) {
    cachedContent = await processAllContent()
  }
  return cachedContent
}
