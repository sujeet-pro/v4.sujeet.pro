/**
 * Content Public API
 *
 * Single entry point for all content operations.
 * Pages should import from this module only.
 *
 * ## Usage Examples
 *
 * ### Article Page
 * ```typescript
 * import { getArticlePage, getAllArticlePaths } from "@/utils/content"
 *
 * const paths = await getAllArticlePaths()
 * const data = await getArticlePage(slug)
 * const { article, siblingArticles, prevArticle, nextArticle } = data
 * ```
 *
 * ### Category Page
 * ```typescript
 * import { getCategoryPage, getAllCategoryIds } from "@/utils/content"
 *
 * const categoryIds = await getAllCategoryIds()
 * const data = await getCategoryPage(categoryId)
 * const { category, index, topics, articles } = data
 * ```
 *
 * ### Topic Page
 * ```typescript
 * import { getTopicPage, getAllTopicPaths } from "@/utils/content"
 *
 * const paths = await getAllTopicPaths()
 * const data = await getTopicPage(categoryId, topicId)
 * const { topic, index, articles } = data
 * ```
 */

import {
  getAllArticleCards,
  getAllArticlesDetailed,
  getAllTopics,
  getBrowseContent,
  getFeaturedArticlesCards,
  getFeaturedTopics,
} from "./cards"
import { getAllBlogCards, getAllBlogPaths, getBlogPage } from "./blogs"
import { getAllProjectCards, getAllProjectPaths, getProjectPage } from "./projects"
import { getAllTags, getAllTagSlugs, getTagContent } from "./tags"
import { filterDrafts } from "./drafts"
import { sortByOrdering, sortByOrderingWithId } from "./sorting"
import {
  getArticlesForTopicFromConfig,
  getArticlesOrderFromConfig,
  getCategoryOrderFromConfig,
  getFeaturedArticleSlugs,
  getFeaturedTopicIds,
  getTopicsOrderFromConfig,
} from "./ordering"
import { getProcessedContent } from "./core"
import type {
  ArticleCardInfo,
  ArticleDetailedInfo,
  ArticlePageData,
  BlogCardInfo,
  BlogItem,
  CardLinkInfo,
  CategoryCardInfo,
  CategoryIndex,
  CategoryPageData,
  CategoryRef,
  CategoryWithTopicsAndArticles,
  ContentItem,
  ContentItemWithoutContent,
  IndexItem,
  ProjectCardInfo,
  ProjectItem,
  ResolvedTopic,
  TagInfo,
  TopicCardInfo,
  TopicIndex,
  TopicPageData,
  TopicRef,
  TopicWithArticles,
} from "./types"

// Re-export types for convenience
export type {
  ArticleCardInfo,
  ArticleDetailedInfo,
  ArticlePageData,
  BlogCardInfo,
  BlogItem,
  CardLinkInfo,
  CategoryCardInfo,
  CategoryIndex,
  CategoryPageData,
  CategoryRef,
  CategoryWithTopicsAndArticles,
  ContentItem,
  ContentItemWithoutContent,
  IndexItem,
  ProjectCardInfo,
  ProjectItem,
  ResolvedTopic,
  TagInfo,
  TopicCardInfo,
  TopicIndex,
  TopicPageData,
  TopicRef,
  TopicWithArticles,
}

export {
  getAllArticleCards,
  getAllArticlesDetailed,
  getAllTopics,
  getBrowseContent,
  getFeaturedArticlesCards,
  getFeaturedTopics,
  // Blog exports
  getAllBlogCards,
  getAllBlogPaths,
  getBlogPage,
  // Project exports
  getAllProjectCards,
  getAllProjectPaths,
  getProjectPage,
  // Tag exports
  getAllTags,
  getAllTagSlugs,
  getTagContent,
}

// =============================================================================
// Page Data Functions (one call = everything needed)
// =============================================================================

/**
 * Get all data needed to render an article page.
 *
 * @param postId - The article's postId (slug)
 * @returns Complete article page data or null if not found
 */
export async function getArticlePage(postId: string): Promise<ArticlePageData | null> {
  const { articles: allArticles } = await getProcessedContent()
  const articles = filterDrafts(allArticles)

  const article = articles.find((a) => a.postId === postId)
  if (!article) return null

  // Get all articles in the same topic
  const siblingArticles = articles
    .filter((a) => a.categoryId === article.categoryId && a.topicId === article.topicId)
    .map(({ Content: _, ...rest }) => rest)

  // Find current article's position in the ordered list
  const currentIndex = siblingArticles.findIndex((a) => a.postId === postId)

  // Get prev/next (note: order is maintained from processAllContent)
  const prevArticle = currentIndex > 0 ? (siblingArticles[currentIndex - 1] ?? null) : null
  const nextArticle = currentIndex < siblingArticles.length - 1 ? (siblingArticles[currentIndex + 1] ?? null) : null

  return {
    article,
    siblingArticles,
    prevArticle,
    nextArticle,
  }
}

/**
 * Get all article paths for static generation.
 *
 * @returns Array of path params { category, topic, slug }
 */
export async function getAllArticlePaths(): Promise<Array<{ category: string; topic: string; slug: string }>> {
  const { articles } = await getProcessedContent()
  // Include drafts for static path generation (they'll be filtered at render time)

  return articles.map((article) => ({
    category: article.categoryId,
    topic: article.topicId,
    slug: article.postId,
  }))
}

/**
 * Get all data needed to render a category page.
 *
 * @param categoryId - The category ID
 * @returns Complete category page data or null if not found
 */
export async function getCategoryPage(categoryId: string): Promise<CategoryPageData | null> {
  const { indexItems, categoryLookup, articlesWithoutContent, topicLookup, topicOrder } = await getProcessedContent()

  const category = categoryLookup.get(categoryId)
  if (!category) return null

  // Get category index
  const index = indexItems.find(
    (item): item is CategoryIndex => item.indexType === "category" && item.category.id === categoryId,
  )
  if (!index) return null

  // Get all articles in this category (filtered for drafts)
  const allCategoryArticles = filterDrafts(articlesWithoutContent.filter((a) => a.categoryId === categoryId))

  // Get global articles order for sorting
  const articlesOrder = await getArticlesOrderFromConfig()
  const articles = sortByOrdering(allCategoryArticles, articlesOrder, (a) => a.postId)

  // Get topics in order
  const categoryTopicOrder = topicOrder.get(categoryId) ?? []
  const topics: TopicWithArticles[] = []

  for (const topicId of categoryTopicOrder) {
    const topicRef = topicLookup.get(`${categoryId}/${topicId}`)
    if (!topicRef) continue

    const topicArticleOrder = await getArticlesForTopicFromConfig(topicId)
    const topicArticles = sortByOrdering(
      allCategoryArticles.filter((a) => a.topicId === topicId),
      topicArticleOrder,
      (a) => a.postId,
    )

    if (topicArticles.length > 0) {
      topics.push({
        ...topicRef,
        articles: topicArticles,
      })
    }
  }

  return {
    category,
    index,
    topics,
    articles,
  }
}

/**
 * Get all category IDs for static generation.
 */
export async function getAllCategoryIds(): Promise<string[]> {
  const { categoryOrder } = await getProcessedContent()
  return categoryOrder
}

/**
 * Get all data needed to render a topic page.
 *
 * @param categoryId - The category ID
 * @param topicId - The topic ID
 * @returns Complete topic page data or null if not found
 */
export async function getTopicPage(categoryId: string, topicId: string): Promise<TopicPageData | null> {
  const { indexItems, categoryLookup, topicLookup, articlesWithoutContent } = await getProcessedContent()

  const topicKey = `${categoryId}/${topicId}`
  const topicRef = topicLookup.get(topicKey)
  if (!topicRef) return null

  const category = categoryLookup.get(categoryId)
  if (!category) return null

  // Get topic index
  const index = indexItems.find(
    (item): item is TopicIndex =>
      item.indexType === "topic" && item.category.id === categoryId && item.topic.id === topicId,
  )
  if (!index) return null

  // Get articles for this topic (filtered and ordered)
  const topicArticleOrder = await getArticlesForTopicFromConfig(topicId)
  const articles = sortByOrdering(
    filterDrafts(articlesWithoutContent.filter((a) => a.categoryId === categoryId && a.topicId === topicId)),
    topicArticleOrder,
    (a) => a.postId,
  )

  // Create resolved topic with category
  const topic: ResolvedTopic = {
    ...topicRef,
    category,
  }

  return {
    topic,
    index,
    articles,
  }
}

/**
 * Get all topic paths for static generation.
 */
export async function getAllTopicPaths(): Promise<Array<{ category: string; topic: string }>> {
  const { categoryOrder, topicOrder } = await getProcessedContent()
  const paths: Array<{ category: string; topic: string }> = []

  for (const categoryId of categoryOrder) {
    const topicIds = topicOrder.get(categoryId) ?? []
    for (const topicId of topicIds) {
      paths.push({ category: categoryId, topic: topicId })
    }
  }

  return paths
}

// =============================================================================
// Listing Functions (for homepage, browse, nav)
// =============================================================================

/**
 * Get all articles (without Content component), ordered by articlesOrder.
 * Excludes drafts in production.
 */
export async function getAllArticles(): Promise<ContentItemWithoutContent[]> {
  const { articlesWithoutContent } = await getProcessedContent()
  const order = await getArticlesOrderFromConfig()
  return sortByOrdering(filterDrafts(articlesWithoutContent), order, (a) => a.postId)
}

/**
 * Get all articles including drafts (for static path generation).
 * Returns full ContentItem with Content component.
 */
export async function getAllArticlesIncludingDrafts(): Promise<ContentItem[]> {
  const { articles } = await getProcessedContent()
  return articles
}

/**
 * Get all categories, ordered by categoryOrder.
 */
export async function getAllCategories(): Promise<CategoryRef[]> {
  const { categoryLookup } = await getProcessedContent()
  const order = await getCategoryOrderFromConfig()
  return sortByOrderingWithId(Array.from(categoryLookup.values()), order)
}

/**
 * Get all topics with their articles, ordered by topicsOrder.
 */
export async function getAllTopicsWithArticles(): Promise<TopicWithArticles[]> {
  const { topicLookup, articlesWithoutContent } = await getProcessedContent()
  const topicsOrder = await getTopicsOrderFromConfig()
  const allTopics = sortByOrdering(Array.from(topicLookup.values()), topicsOrder, (t) => t.id)
  const filteredArticles = filterDrafts(articlesWithoutContent)

  const result: TopicWithArticles[] = []
  for (const topic of allTopics) {
    const topicArticleOrder = await getArticlesForTopicFromConfig(topic.id)
    const topicArticles = sortByOrdering(
      filteredArticles.filter((a) => a.topicId === topic.id),
      topicArticleOrder,
      (a) => a.postId,
    )

    if (topicArticles.length > 0) {
      result.push({
        ...topic,
        articles: topicArticles,
      })
    }
  }
  return result
}

/**
 * Get the full category hierarchy with topics and articles.
 */
export async function getCategoryHierarchy(): Promise<CategoryWithTopicsAndArticles[]> {
  const { categoryLookup, topicLookup, articlesWithoutContent, categoryOrder, topicOrder } = await getProcessedContent()
  const filteredArticles = filterDrafts(articlesWithoutContent)
  const result: CategoryWithTopicsAndArticles[] = []

  for (const categoryId of categoryOrder) {
    const category = categoryLookup.get(categoryId)
    if (!category) continue

    const categoryTopicOrder = topicOrder.get(categoryId) ?? []
    const topicsWithArticles: TopicWithArticles[] = []
    let totalArticles = 0

    for (const topicId of categoryTopicOrder) {
      const topicRef = topicLookup.get(`${categoryId}/${topicId}`)
      if (!topicRef) continue

      const topicArticleOrder = await getArticlesForTopicFromConfig(topicId)
      const topicArticles = sortByOrdering(
        filteredArticles.filter((a) => a.categoryId === categoryId && a.topicId === topicId),
        topicArticleOrder,
        (a) => a.postId,
      )

      if (topicArticles.length > 0) {
        topicsWithArticles.push({
          ...topicRef,
          articles: topicArticles,
        })
        totalArticles += topicArticles.length
      }
    }

    if (totalArticles > 0) {
      result.push({
        ...category,
        topics: topicsWithArticles,
        articleCount: totalArticles,
      })
    }
  }

  return result
}

/**
 * Get featured articles for homepage.
 */
export async function getFeaturedArticles(): Promise<ContentItemWithoutContent[]> {
  const { articlesWithoutContent } = await getProcessedContent()
  const featuredSlugs = await getFeaturedArticleSlugs()
  const filteredArticles = filterDrafts(articlesWithoutContent)

  const result: ContentItemWithoutContent[] = []
  for (const slug of featuredSlugs) {
    const article = filteredArticles.find((a) => a.postId === slug)
    if (article) {
      result.push(article)
    }
  }
  return result
}

/**
 * Get featured topics with their articles for homepage.
 */
export async function getFeaturedTopicsWithArticles(): Promise<TopicWithArticles[]> {
  const { topicLookup, articlesWithoutContent } = await getProcessedContent()
  const featuredIds = await getFeaturedTopicIds()
  const filteredArticles = filterDrafts(articlesWithoutContent)

  const result: TopicWithArticles[] = []
  for (const id of featuredIds) {
    // Find topic in lookup (need to search values since key is categoryId/topicId)
    const topicRef = Array.from(topicLookup.values()).find((t) => t.id === id)
    if (!topicRef) continue

    const topicArticleOrder = await getArticlesForTopicFromConfig(id)
    const topicArticles = sortByOrdering(
      filteredArticles.filter((a) => a.topicId === id),
      topicArticleOrder,
      (a) => a.postId,
    )

    if (topicArticles.length > 0) {
      result.push({
        ...topicRef,
        articles: topicArticles,
      })
    }
  }
  return result
}
