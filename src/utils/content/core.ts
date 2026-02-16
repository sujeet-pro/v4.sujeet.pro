/**
 * Content Core Processing
 *
 * Main processor for all articles and index files.
 * Builds lookups, validates structure, and caches processed content.
 */

import { getCollection, render } from "astro:content"
import { parseFrontmatter } from "./helpers"
import { getArticlesForTopicFromConfig, getCategoryOrderFromConfig, getTopicsForCategoryFromConfig } from "./ordering"
import type {
  CategoryIndex,
  CategoryRef,
  ContentItem,
  ContentItemWithoutContent,
  IndexItem,
  TopicIndex,
  TopicRef,
} from "./types"
import { validateContentStructure } from "./validation"

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
      lastUpdatedOn: item.data.lastUpdatedOn,
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
