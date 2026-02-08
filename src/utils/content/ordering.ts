/**
 * Ordering configuration utilities
 *
 * Access to ordering.json5 hierarchical content ordering.
 */

import { getCollection } from "astro:content"
import type { DerivedOrdering, OrderingConfig } from "./types"

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
      projects: orderingData.data.projects ?? [],
      pinnedArticles: orderingData.data.pinnedArticles ?? [],
      pinnedBlogs: orderingData.data.pinnedBlogs ?? [],
      pinnedProjects: orderingData.data.pinnedProjects ?? [],
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
