import * as fs from "node:fs"
import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { CONTENT_DIR, discoverContent, type ContentStructure } from "./lib/content"
import { loadJsonc } from "./lib/jsonc"
import { Logger } from "./lib/logger"

export interface OrderingJsonc {
  categoryOrder: string[]
  topicsOrder: string[]
  articlesOrder: string[]
  categoryVsTopics: Record<string, string[]>
  topicVsArticlesOrder: Record<string, string[]>
  featuredArticles: string[]
  featuredTopics: string[]
}

interface OrderingIssue {
  message: string
}

function validateOrdering(orderingConfig: OrderingJsonc, content: ReturnType<typeof discoverContent>): OrderingIssue[] {
  const issues: OrderingIssue[] = []

  const orderingCategories = new Set(orderingConfig.categoryOrder)
  const existingCategories = new Set(content.categories)

  for (const categoryId of content.categories) {
    if (!orderingCategories.has(categoryId)) {
      issues.push({ message: `Category missing from categoryOrder: ${categoryId}` })
    }
  }

  for (const categoryId of orderingConfig.categoryOrder) {
    if (!existingCategories.has(categoryId)) {
      issues.push({ message: `Orphan category in categoryOrder: ${categoryId}` })
    }
  }

  const orderingTopics = new Set(orderingConfig.topicsOrder)
  const existingTopics = new Set(content.allTopicIds)

  const seenTopics = new Set<string>()
  for (const topicId of orderingConfig.topicsOrder) {
    if (seenTopics.has(topicId)) {
      issues.push({ message: `Duplicate topic in topicsOrder: ${topicId}` })
    }
    seenTopics.add(topicId)
  }

  for (const topicId of content.allTopicIds) {
    if (!orderingTopics.has(topicId)) {
      issues.push({ message: `Topic missing from topicsOrder: ${topicId}` })
    }
  }

  for (const topicId of orderingConfig.topicsOrder) {
    if (!existingTopics.has(topicId)) {
      issues.push({ message: `Orphan topic in topicsOrder: ${topicId}` })
    }
  }

  const orderingArticles = new Set(orderingConfig.articlesOrder)
  const existingArticles = new Set(content.allArticleSlugs)

  const seenArticles = new Set<string>()
  for (const slug of orderingConfig.articlesOrder) {
    if (seenArticles.has(slug)) {
      issues.push({ message: `Duplicate article in articlesOrder: ${slug}` })
    }
    seenArticles.add(slug)
  }

  for (const slug of content.allArticleSlugs) {
    if (!orderingArticles.has(slug)) {
      issues.push({ message: `Article missing from articlesOrder: ${slug}` })
    }
  }

  for (const slug of orderingConfig.articlesOrder) {
    if (!existingArticles.has(slug)) {
      issues.push({ message: `Orphan article in articlesOrder: ${slug}` })
    }
  }

  for (const categoryId of content.categories) {
    const topicsInMapping = orderingConfig.categoryVsTopics[categoryId]
    if (!topicsInMapping) {
      issues.push({ message: `Category missing from categoryVsTopics: ${categoryId}` })
      continue
    }

    const actualTopics = content.topics.get(categoryId) ?? []
    const mappingTopicsSet = new Set(topicsInMapping)
    const actualTopicsSet = new Set(actualTopics)

    for (const topicId of actualTopics) {
      if (!mappingTopicsSet.has(topicId)) {
        issues.push({ message: `Topic "${topicId}" missing from categoryVsTopics["${categoryId}"]` })
      }
    }

    for (const topicId of topicsInMapping) {
      if (!actualTopicsSet.has(topicId)) {
        issues.push({ message: `Orphan topic "${topicId}" in categoryVsTopics["${categoryId}"]` })
      }
    }
  }

  for (const categoryId of Object.keys(orderingConfig.categoryVsTopics)) {
    if (!existingCategories.has(categoryId)) {
      issues.push({ message: `Orphan category in categoryVsTopics: ${categoryId}` })
    }
  }

  for (const topicId of content.allTopicIds) {
    const articlesInMapping = orderingConfig.topicVsArticlesOrder[topicId]
    if (!articlesInMapping) {
      issues.push({ message: `Topic missing from topicVsArticlesOrder: ${topicId}` })
      continue
    }

    const actualArticles = content.articles.get(topicId) ?? []
    const mappingArticlesSet = new Set(articlesInMapping)
    const actualArticlesSet = new Set(actualArticles)

    for (const slug of actualArticles) {
      if (!mappingArticlesSet.has(slug)) {
        issues.push({ message: `Article "${slug}" missing from topicVsArticlesOrder["${topicId}"]` })
      }
    }

    for (const slug of articlesInMapping) {
      if (!actualArticlesSet.has(slug)) {
        issues.push({ message: `Orphan article "${slug}" in topicVsArticlesOrder["${topicId}"]` })
      }
    }
  }

  for (const topicId of Object.keys(orderingConfig.topicVsArticlesOrder)) {
    if (!existingTopics.has(topicId)) {
      issues.push({ message: `Orphan topic in topicVsArticlesOrder: ${topicId}` })
    }
  }

  for (const slug of orderingConfig.featuredArticles) {
    if (!existingArticles.has(slug)) {
      issues.push({ message: `Featured article not found: ${slug}` })
    }
  }

  for (const topicId of orderingConfig.featuredTopics) {
    if (!existingTopics.has(topicId)) {
      issues.push({ message: `Featured topic not found: ${topicId}` })
    }
  }

  const allSlugs = new Set<string>()

  for (const categoryId of content.categories) {
    if (allSlugs.has(categoryId)) {
      issues.push({ message: `Category ID "${categoryId}" conflicts with another slug` })
    }
    allSlugs.add(categoryId)
  }

  for (const topicId of content.allTopicIds) {
    if (allSlugs.has(topicId)) {
      issues.push({ message: `Topic ID "${topicId}" conflicts with another slug` })
    }
    allSlugs.add(topicId)
  }

  for (const slug of content.allArticleSlugs) {
    if (allSlugs.has(slug)) {
      issues.push({ message: `Article slug "${slug}" conflicts with another slug` })
    }
    allSlugs.add(slug)
  }

  return issues
}

export interface ContentOrderingValidationOptions {
  orderingConfig?: OrderingJsonc | null
  content?: ContentStructure
}

export async function runContentOrderingValidation(options: ContentOrderingValidationOptions = {}) {
  const logger = new Logger("validate-content-ordering", { humanReadable: true })
  const orderingPath = path.join(process.cwd(), "content/ordering.jsonc")
  const orderingRelative = path.relative(process.cwd(), orderingPath)

  logger.info("=".repeat(60))
  logger.info("Content Ordering Validation")
  logger.info("=".repeat(60))
  logger.info(`Ordering file: ${orderingRelative}`)
  logger.info("")

  const hasOrderingConfig = Object.prototype.hasOwnProperty.call(options, "orderingConfig")
  const orderingConfig = hasOrderingConfig ? options.orderingConfig : loadJsonc<OrderingJsonc>(orderingPath)
  if (!orderingConfig) {
    logger.error("ordering.jsonc not found")
    const summary = {
      schemaVersion: 1,
      tool: "validate-content-ordering",
      status: "fail",
      generatedAt: new Date().toISOString(),
      summary: {
        issues: 1,
        filesWithIssues: 1,
      },
      files: [
        {
          file: orderingRelative,
          issues: [{ message: "ordering.jsonc not found" }],
        },
      ],
    }
    const summaryPath = logger.saveSummary(summary)
    logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
    logger.save()
    return { exitCode: 1, summaryPath }
  }

  if (!options.content && !fs.existsSync(CONTENT_DIR)) {
    logger.error(`Content directory not found: ${CONTENT_DIR}`)
    const summary = {
      schemaVersion: 1,
      tool: "validate-content-ordering",
      status: "fail",
      generatedAt: new Date().toISOString(),
      summary: {
        issues: 1,
        filesWithIssues: 0,
        contentDir: path.relative(process.cwd(), CONTENT_DIR),
      },
      files: [],
      notes: ["Content directory not found."],
    }
    const summaryPath = logger.saveSummary(summary)
    logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
    logger.save()
    return { exitCode: 1, summaryPath }
  }

  const content = options.content ?? discoverContent()
  const issues = validateOrdering(orderingConfig, content)

  if (issues.length > 0) {
    logger.error(`Ordering issues found: ${issues.length}`)
    for (const issue of issues) {
      logger.error(issue.message)
    }
  } else {
    logger.success("ordering.jsonc matches content structure.")
  }

  const summary = {
    schemaVersion: 1,
    tool: "validate-content-ordering",
    status: issues.length > 0 ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      issues: issues.length,
      filesWithIssues: issues.length > 0 ? 1 : 0,
    },
    files:
      issues.length > 0
        ? [
            {
              file: orderingRelative,
              issues: issues.map((issue) => ({ message: issue.message })),
            },
          ]
        : [],
  }
  const summaryPath = logger.saveSummary(summary)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)

  logger.save()
  return { exitCode: issues.length > 0 ? 1 : 0, summaryPath }
}

if (isDirectRun(import.meta.url)) {
  runContentOrderingValidation()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
