/**
 * Card-focused content utilities (cached)
 *
 * Provides lightweight, card-friendly content data with stable ordering.
 */

import type { MarkdownHeading } from "astro"
import { getCollection, render } from "astro:content"

import { filterDrafts, getDerivedOrdering, getOrdering, getProcessedContent, sortByOrdering } from "./content.core"
import type {
  ArticleCardCache,
  ArticleCardInfo,
  ArticleDetailedInfo,
  CardLinkInfo,
  CategoryCardCache,
  CategoryCardInfo,
  ContentItemWithoutContent,
  TopicCardCache,
  TopicCardInfo,
  TopicRef,
} from "./content.types"

interface CardCaches {
  articleCardCache: ArticleCardCache
  topicCardCache: TopicCardCache
  categoryCardCache: CategoryCardCache
  browseContent: CategoryCardInfo[]
  allArticleCards: ArticleCardInfo[]
  allTopicCards: TopicCardInfo[]
  featuredArticleCards: ArticleCardInfo[]
  featuredTopicCards: TopicCardInfo[]
}

let cachedCardData: CardCaches | null = null
let cachedHeadings: Record<string, MarkdownHeading[]> | null = null
let cachedDetailedArticles: ArticleDetailedInfo[] | null = null

function toCardLink(source: { id: string; name: string; href: string; title?: string }): CardLinkInfo {
  const link: CardLinkInfo = {
    id: source.id,
    name: source.name,
    href: source.href,
  }

  if (source.title !== undefined) {
    link.title = source.title
  }

  return link
}

async function buildCardCaches(): Promise<CardCaches> {
  if (cachedCardData) return cachedCardData

  const { articlesWithoutContent, categoryLookup, topicLookup } = await getProcessedContent()
  const ordering = await getOrdering()
  const derived = await getDerivedOrdering()
  const filteredArticles = filterDrafts(articlesWithoutContent)

  const topicRefsById = new Map<string, TopicRef>()
  for (const topicRef of topicLookup.values()) {
    topicRefsById.set(topicRef.id, topicRef)
  }

  const articlesByTopic = new Map<string, ContentItemWithoutContent[]>()
  for (const article of filteredArticles) {
    const list = articlesByTopic.get(article.topicId)
    if (list) {
      list.push(article)
    } else {
      articlesByTopic.set(article.topicId, [article])
    }
  }

  const articleCardCache: ArticleCardCache = {}
  for (const article of filteredArticles) {
    const articleCount = articlesByTopic.get(article.topicId)?.length ?? 0
    articleCardCache[article.postId] = {
      id: article.postId,
      title: article.title,
      description: article.description,
      href: article.href,
      category: toCardLink(article.category),
      topic: toCardLink(article.topic),
      articleCount,
      minutesRead: article.minutesRead,
      isDraft: article.isDraft,
    }
  }

  const topicCardCache: TopicCardCache = {}
  for (const topicId of derived.topicsOrder) {
    const topicRef = topicRefsById.get(topicId)
    if (!topicRef) continue
    const categoryRef = categoryLookup.get(topicRef.categoryId)
    if (!categoryRef) continue

    const topicArticles = articlesByTopic.get(topicId) ?? []
    const topicArticleOrder = derived.topicVsArticlesOrder[topicId] ?? []
    const articleCards = sortByOrdering(
      topicArticles
        .map((article) => articleCardCache[article.postId])
        .filter((card): card is ArticleCardInfo => Boolean(card)),
      topicArticleOrder,
      (card) => card.id,
    )

    topicCardCache[topicId] = {
      id: topicRef.id,
      title: topicRef.title,
      name: topicRef.name,
      description: topicRef.description,
      href: topicRef.href,
      category: toCardLink(categoryRef),
      articleCount: articleCards.length,
      articles: articleCards,
    }
  }

  const allTopicCards = sortByOrdering(
    Object.values(topicCardCache).filter((topic) => topic.articleCount > 0),
    derived.topicsOrder,
    (topic) => topic.id,
  )

  const categoryCardCache: CategoryCardCache = {}
  const browseContent: CategoryCardInfo[] = []

  for (const categoryId of derived.categoryOrder) {
    const categoryRef = categoryLookup.get(categoryId)
    if (!categoryRef) continue

    const topicIds = derived.categoryVsTopics[categoryId] ?? []
    const topicCards = topicIds
      .map((topicId) => topicCardCache[topicId])
      .filter((topic): topic is TopicCardInfo => Boolean(topic && topic.articleCount > 0))

    const articleCount = topicCards.reduce((sum, topic) => sum + topic.articleCount, 0)
    if (articleCount === 0) continue

    const categoryCard: CategoryCardInfo = {
      id: categoryRef.id,
      title: categoryRef.title,
      name: categoryRef.name,
      description: categoryRef.description,
      href: categoryRef.href,
      topicCount: topicCards.length,
      articleCount,
      topics: topicCards,
    }

    categoryCardCache[categoryId] = categoryCard
    browseContent.push(categoryCard)
  }

  const allArticleCards = sortByOrdering(Object.values(articleCardCache), derived.articlesOrder, (card) => card.id)

  const featuredArticleCards = ordering.featuredArticles
    .map((id) => articleCardCache[id])
    .filter((card): card is ArticleCardInfo => Boolean(card))

  const featuredTopicCards = ordering.featuredTopics
    .map((id) => topicCardCache[id])
    .filter((topic): topic is TopicCardInfo => Boolean(topic && topic.articleCount > 0))

  cachedCardData = {
    articleCardCache,
    topicCardCache,
    categoryCardCache,
    browseContent,
    allArticleCards,
    allTopicCards,
    featuredArticleCards,
    featuredTopicCards,
  }

  return cachedCardData
}

async function getHeadingsCache(): Promise<Record<string, MarkdownHeading[]>> {
  if (cachedHeadings) return cachedHeadings

  const articleEntries = await getCollection("article")
  const headingsById: Record<string, MarkdownHeading[]> = {}

  await Promise.all(
    articleEntries.map(async (entry) => {
      const { headings } = await render(entry)
      headingsById[entry.id] = headings ?? []
    }),
  )

  cachedHeadings = headingsById
  return cachedHeadings
}

function buildPrevNextMap(
  articles: ArticleCardInfo[],
): Map<string, { prev: ArticleCardInfo | null; next: ArticleCardInfo | null }> {
  const prevNextMap = new Map<string, { prev: ArticleCardInfo | null; next: ArticleCardInfo | null }>()

  for (let index = 0; index < articles.length; index++) {
    const current = articles[index]
    if (!current) continue
    prevNextMap.set(current.id, {
      prev: index > 0 ? (articles[index - 1] ?? null) : null,
      next: index < articles.length - 1 ? (articles[index + 1] ?? null) : null,
    })
  }

  return prevNextMap
}

// =============================================================================
// Public API
// =============================================================================

export async function getAllArticleCards(): Promise<ArticleCardInfo[]> {
  const { allArticleCards } = await buildCardCaches()
  return allArticleCards
}

export async function getFeaturedArticlesCards(): Promise<ArticleCardInfo[]> {
  const { featuredArticleCards } = await buildCardCaches()
  return featuredArticleCards
}

export async function getBrowseContent(): Promise<CategoryCardInfo[]> {
  const { browseContent } = await buildCardCaches()
  return browseContent
}

export async function getAllTopics(): Promise<TopicCardInfo[]> {
  const { allTopicCards } = await buildCardCaches()
  return allTopicCards
}

export async function getFeaturedTopics(): Promise<TopicCardInfo[]> {
  const { featuredTopicCards } = await buildCardCaches()
  return featuredTopicCards
}

export async function getAllArticlesDetailed(): Promise<ArticleDetailedInfo[]> {
  if (cachedDetailedArticles) return cachedDetailedArticles

  const { articles } = await getProcessedContent()
  const filteredArticles = filterDrafts(articles)
  const articleById = new Map(filteredArticles.map((article) => [article.postId, article]))

  const { browseContent, topicCardCache } = await buildCardCaches()
  const headingsById = await getHeadingsCache()

  const flattenedArticles: ArticleCardInfo[] = []
  for (const category of browseContent) {
    for (const topic of category.topics) {
      flattenedArticles.push(...topic.articles)
    }
  }

  const prevNextMap = buildPrevNextMap(flattenedArticles)

  const detailedArticles: ArticleDetailedInfo[] = []
  for (const card of flattenedArticles) {
    const article = articleById.get(card.id)
    const topic = topicCardCache[card.topic.id]
    if (!article || !topic) continue

    detailedArticles.push({
      article,
      card,
      topic,
      toc: headingsById[card.id] ?? [],
      prev: prevNextMap.get(card.id)?.prev ?? null,
      next: prevNextMap.get(card.id)?.next ?? null,
    })
  }

  cachedDetailedArticles = detailedArticles
  return cachedDetailedArticles
}
