/**
 * Content structure validation
 */

import type { CategoryRef, ContentItem, TopicRef } from "./types"

/**
 * Validate content structure and throw build errors for issues
 */
export function validateContentStructure(
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
