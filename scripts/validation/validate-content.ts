/**
 * Content Validation Script
 *
 * Validates content structure and configuration files:
 * - H1 headings: Every README.md has exactly one H1 (optionally with "Draft:" prefix)
 * - ordering.jsonc: Validates completeness and uniqueness of all ordering config
 * - home.jsonc references: Profile data exists
 * - vanity.jsonc internal redirects: Point to valid paths
 *
 * Usage:
 *   npx tsx scripts/validation/validate-content.ts [--fix]
 *
 * Logs are saved to: logs/validate-content-{timestamp}.log
 */

import * as fs from "fs"
import * as path from "path"

// =============================================================================
// Configuration
// =============================================================================

const CONTENT_DIR = path.join(process.cwd(), "content/articles")
const LOGS_DIR = path.join(process.cwd(), "logs")

// =============================================================================
// Types
// =============================================================================

interface ValidationError {
  type: "error" | "warning"
  path: string
  message: string
  fixable: boolean
}

interface OrderingJsonc {
  categoryOrder: string[]
  topicsOrder: string[]
  articlesOrder: string[]
  categoryVsTopics: Record<string, string[]>
  topicVsArticlesOrder: Record<string, string[]>
  featuredArticles: string[]
  featuredTopics: string[]
}

interface HomeJsonc {
  profile: {
    name: string
    title: string
    bio: string
    imageAlt: string
  }
  profileActions: {
    viewCv: string
    allArticles: string
  }
}

interface VanityEntry {
  id: string
  target: string
}

// =============================================================================
// Logger
// =============================================================================

class Logger {
  private logFile: string
  private logs: string[] = []

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    this.logFile = path.join(LOGS_DIR, `validate-content-${timestamp}.log`)
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }

  log(message: string, level: "INFO" | "ERROR" | "WARN" | "SUCCESS" = "INFO") {
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${level}] ${message}`
    this.logs.push(logLine)

    const colors = {
      INFO: "\x1b[36m",
      ERROR: "\x1b[31m",
      WARN: "\x1b[33m",
      SUCCESS: "\x1b[32m",
    }
    console.log(`${colors[level]}${logLine}\x1b[0m`)
  }

  save() {
    fs.writeFileSync(this.logFile, this.logs.join("\n"))
    console.log(`\n\x1b[36mLogs saved to: ${this.logFile}\x1b[0m`)
  }
}

// =============================================================================
// JSONC Parser
// =============================================================================

function parseJsonc<T>(content: string): T {
  const cleaned = content.replace(/"(?:[^"\\]|\\.)*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (match) => {
    if (match.startsWith('"')) return match
    return ""
  })
  const noTrailingCommas = cleaned.replace(/,(\s*[}\]])/g, "$1")
  return JSON.parse(noTrailingCommas) as T
}

function loadJsonc<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, "utf-8")
  return parseJsonc<T>(content)
}

// =============================================================================
// Content Discovery
// =============================================================================

interface ContentStructure {
  categories: string[]
  topics: Map<string, string[]> // categoryId -> topicIds
  articles: Map<string, string[]> // topicId -> articleSlugs
  allArticlePaths: string[] // "category/topic/slug"
  allArticleSlugs: string[] // just "slug"
  allTopicIds: string[] // just "topicId"
}

function discoverContent(): ContentStructure {
  const categories: string[] = []
  const topics = new Map<string, string[]>()
  const articles = new Map<string, string[]>()
  const allArticlePaths: string[] = []
  const allArticleSlugs: string[] = []
  const allTopicIds: string[] = []

  // Get categories (depth 1)
  const categoryDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))

  for (const categoryDir of categoryDirs) {
    const categoryId = categoryDir.name
    const categoryPath = path.join(CONTENT_DIR, categoryId)

    // Check if category has README.md
    if (fs.existsSync(path.join(categoryPath, "README.md"))) {
      categories.push(categoryId)
    }

    // Get topics (depth 2)
    const topicDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))

    const categoryTopics: string[] = []
    for (const topicDir of topicDirs) {
      const topicId = topicDir.name
      const topicPath = path.join(categoryPath, topicId)

      // Check if topic has README.md
      if (fs.existsSync(path.join(topicPath, "README.md"))) {
        categoryTopics.push(topicId)
        allTopicIds.push(topicId)
      }

      // Get articles (depth 3)
      const articleDirs = fs
        .readdirSync(topicPath, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith("."))

      const topicArticles: string[] = []
      for (const articleDir of articleDirs) {
        const articleSlug = articleDir.name
        const articlePath = path.join(topicPath, articleSlug)

        // Check if article has README.md
        if (fs.existsSync(path.join(articlePath, "README.md"))) {
          topicArticles.push(articleSlug)
          allArticlePaths.push(`${categoryId}/${topicId}/${articleSlug}`)
          allArticleSlugs.push(articleSlug)
        }
      }

      if (topicArticles.length > 0) {
        articles.set(topicId, topicArticles)
      }
    }

    if (categoryTopics.length > 0) {
      topics.set(categoryId, categoryTopics)
    }
  }

  return { categories, topics, articles, allArticlePaths, allArticleSlugs, allTopicIds }
}

// =============================================================================
// Validators
// =============================================================================

/**
 * Validate H1 headings in README.md files
 * Only checks for H1 headings outside of code blocks
 */
function validateH1Headings(_logger: Logger): ValidationError[] {
  const errors: ValidationError[] = []

  function removeCodeBlocks(content: string): string {
    // Remove fenced code blocks (```...``` and ~~~...~~~)
    let result = content.replace(/```[\s\S]*?```/g, "")
    result = result.replace(/~~~[\s\S]*?~~~/g, "")
    // Remove inline code (`...`)
    result = result.replace(/`[^`]+`/g, "")
    return result
  }

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        walkDir(fullPath)
      } else if (entry.name === "README.md") {
        const content = fs.readFileSync(fullPath, "utf-8")
        // Remove code blocks before checking for H1s
        const contentWithoutCode = removeCodeBlocks(content)
        const h1Matches = contentWithoutCode.match(/^#\s+.+$/gm)
        const relativePath = path.relative(CONTENT_DIR, fullPath)

        if (!h1Matches || h1Matches.length === 0) {
          errors.push({
            type: "error",
            path: relativePath,
            message: "Missing H1 heading",
            fixable: false,
          })
        } else if (h1Matches.length > 1) {
          errors.push({
            type: "error",
            path: relativePath,
            message: `Multiple H1 headings found (${h1Matches.length}): ${h1Matches.map((h) => h.trim()).join(", ")}`,
            fixable: false,
          })
        }
      }
    }
  }

  walkDir(CONTENT_DIR)
  return errors
}

/**
 * Validate ordering.jsonc completeness and uniqueness
 */
function validateOrderingJsonc(content: ContentStructure, _logger: Logger): ValidationError[] {
  const errors: ValidationError[] = []
  const orderingPath = path.join(process.cwd(), "content/ordering.jsonc")

  const orderingConfig = loadJsonc<OrderingJsonc>(orderingPath)
  if (!orderingConfig) {
    errors.push({
      type: "error",
      path: "content/ordering.jsonc",
      message: "ordering.jsonc not found",
      fixable: false,
    })
    return errors
  }

  // ==========================================================================
  // Validate categoryOrder completeness
  // ==========================================================================
  const orderingCategories = new Set(orderingConfig.categoryOrder)
  const existingCategories = new Set(content.categories)

  // Check for categories not in ordering.jsonc
  for (const categoryId of content.categories) {
    if (!orderingCategories.has(categoryId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Category missing from categoryOrder: ${categoryId}`,
        fixable: true,
      })
    }
  }

  // Check for orphan categories in ordering.jsonc
  for (const categoryId of orderingConfig.categoryOrder) {
    if (!existingCategories.has(categoryId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Orphan category in categoryOrder: ${categoryId}`,
        fixable: true,
      })
    }
  }

  // ==========================================================================
  // Validate topicsOrder completeness and uniqueness
  // ==========================================================================
  const orderingTopics = new Set(orderingConfig.topicsOrder)
  const existingTopics = new Set(content.allTopicIds)

  // Check for duplicate topics in topicsOrder
  const seenTopics = new Set<string>()
  for (const topicId of orderingConfig.topicsOrder) {
    if (seenTopics.has(topicId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Duplicate topic in topicsOrder: ${topicId}`,
        fixable: true,
      })
    }
    seenTopics.add(topicId)
  }

  // Check for topics not in ordering.jsonc
  for (const topicId of content.allTopicIds) {
    if (!orderingTopics.has(topicId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Topic missing from topicsOrder: ${topicId}`,
        fixable: true,
      })
    }
  }

  // Check for orphan topics in ordering.jsonc
  for (const topicId of orderingConfig.topicsOrder) {
    if (!existingTopics.has(topicId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Orphan topic in topicsOrder: ${topicId}`,
        fixable: true,
      })
    }
  }

  // ==========================================================================
  // Validate articlesOrder completeness and uniqueness
  // ==========================================================================
  const orderingArticles = new Set(orderingConfig.articlesOrder)
  const existingArticles = new Set(content.allArticleSlugs)

  // Check for duplicate articles in articlesOrder
  const seenArticles = new Set<string>()
  for (const slug of orderingConfig.articlesOrder) {
    if (seenArticles.has(slug)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Duplicate article in articlesOrder: ${slug}`,
        fixable: true,
      })
    }
    seenArticles.add(slug)
  }

  // Check for articles not in ordering.jsonc
  for (const slug of content.allArticleSlugs) {
    if (!orderingArticles.has(slug)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Article missing from articlesOrder: ${slug}`,
        fixable: true,
      })
    }
  }

  // Check for orphan articles in ordering.jsonc
  for (const slug of orderingConfig.articlesOrder) {
    if (!existingArticles.has(slug)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Orphan article in articlesOrder: ${slug}`,
        fixable: true,
      })
    }
  }

  // ==========================================================================
  // Validate categoryVsTopics completeness
  // ==========================================================================
  for (const categoryId of content.categories) {
    const topicsInMapping = orderingConfig.categoryVsTopics[categoryId]
    if (!topicsInMapping) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Category missing from categoryVsTopics: ${categoryId}`,
        fixable: true,
      })
      continue
    }

    const actualTopics = content.topics.get(categoryId) ?? []
    const mappingTopicsSet = new Set(topicsInMapping)
    const actualTopicsSet = new Set(actualTopics)

    // Check for missing topics
    for (const topicId of actualTopics) {
      if (!mappingTopicsSet.has(topicId)) {
        errors.push({
          type: "error",
          path: "content/ordering.jsonc",
          message: `Topic "${topicId}" missing from categoryVsTopics["${categoryId}"]`,
          fixable: true,
        })
      }
    }

    // Check for orphan topics
    for (const topicId of topicsInMapping) {
      if (!actualTopicsSet.has(topicId)) {
        errors.push({
          type: "error",
          path: "content/ordering.jsonc",
          message: `Orphan topic "${topicId}" in categoryVsTopics["${categoryId}"]`,
          fixable: true,
        })
      }
    }
  }

  // Check for orphan categories in categoryVsTopics
  for (const categoryId of Object.keys(orderingConfig.categoryVsTopics)) {
    if (!existingCategories.has(categoryId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Orphan category in categoryVsTopics: ${categoryId}`,
        fixable: true,
      })
    }
  }

  // ==========================================================================
  // Validate topicVsArticlesOrder completeness
  // ==========================================================================
  for (const topicId of content.allTopicIds) {
    const articlesInMapping = orderingConfig.topicVsArticlesOrder[topicId]
    if (!articlesInMapping) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Topic missing from topicVsArticlesOrder: ${topicId}`,
        fixable: true,
      })
      continue
    }

    const actualArticles = content.articles.get(topicId) ?? []
    const mappingArticlesSet = new Set(articlesInMapping)
    const actualArticlesSet = new Set(actualArticles)

    // Check for missing articles
    for (const slug of actualArticles) {
      if (!mappingArticlesSet.has(slug)) {
        errors.push({
          type: "error",
          path: "content/ordering.jsonc",
          message: `Article "${slug}" missing from topicVsArticlesOrder["${topicId}"]`,
          fixable: true,
        })
      }
    }

    // Check for orphan articles
    for (const slug of articlesInMapping) {
      if (!actualArticlesSet.has(slug)) {
        errors.push({
          type: "error",
          path: "content/ordering.jsonc",
          message: `Orphan article "${slug}" in topicVsArticlesOrder["${topicId}"]`,
          fixable: true,
        })
      }
    }
  }

  // Check for orphan topics in topicVsArticlesOrder
  for (const topicId of Object.keys(orderingConfig.topicVsArticlesOrder)) {
    if (!existingTopics.has(topicId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Orphan topic in topicVsArticlesOrder: ${topicId}`,
        fixable: true,
      })
    }
  }

  // ==========================================================================
  // Validate featuredArticles
  // ==========================================================================
  for (const slug of orderingConfig.featuredArticles) {
    if (!existingArticles.has(slug)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Featured article not found: ${slug}`,
        fixable: true,
      })
    }
  }

  // ==========================================================================
  // Validate featuredTopics
  // ==========================================================================
  for (const topicId of orderingConfig.featuredTopics) {
    if (!existingTopics.has(topicId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Featured topic not found: ${topicId}`,
        fixable: true,
      })
    }
  }

  // ==========================================================================
  // Validate global uniqueness of slugs
  // ==========================================================================
  const allSlugs = new Set<string>()

  // Check category IDs don't conflict
  for (const categoryId of content.categories) {
    if (allSlugs.has(categoryId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Category ID "${categoryId}" conflicts with another slug`,
        fixable: false,
      })
    }
    allSlugs.add(categoryId)
  }

  // Check topic IDs don't conflict
  for (const topicId of content.allTopicIds) {
    if (allSlugs.has(topicId)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Topic ID "${topicId}" conflicts with another slug (category or topic)`,
        fixable: false,
      })
    }
    allSlugs.add(topicId)
  }

  // Check article slugs don't conflict
  for (const slug of content.allArticleSlugs) {
    if (allSlugs.has(slug)) {
      errors.push({
        type: "error",
        path: "content/ordering.jsonc",
        message: `Article slug "${slug}" conflicts with another slug (category, topic, or article)`,
        fixable: false,
      })
    }
    allSlugs.add(slug)
  }

  return errors
}

/**
 * Validate home.jsonc structure
 */
function validateHomeJsonc(_content: ContentStructure, _logger: Logger): ValidationError[] {
  const errors: ValidationError[] = []
  const homePath = path.join(process.cwd(), "content/home.jsonc")

  const homeConfig = loadJsonc<HomeJsonc>(homePath)
  if (!homeConfig) {
    errors.push({
      type: "error",
      path: "content/home.jsonc",
      message: "home.jsonc not found",
      fixable: false,
    })
    return errors
  }

  // Validate required fields
  if (!homeConfig.profile) {
    errors.push({
      type: "error",
      path: "content/home.jsonc",
      message: "Missing profile object",
      fixable: false,
    })
  } else {
    if (!homeConfig.profile.name) {
      errors.push({
        type: "error",
        path: "content/home.jsonc",
        message: "Missing profile.name",
        fixable: false,
      })
    }
    if (!homeConfig.profile.title) {
      errors.push({
        type: "error",
        path: "content/home.jsonc",
        message: "Missing profile.title",
        fixable: false,
      })
    }
  }

  if (!homeConfig.profileActions) {
    errors.push({
      type: "error",
      path: "content/home.jsonc",
      message: "Missing profileActions object",
      fixable: false,
    })
  }

  return errors
}

/**
 * Validate vanity.jsonc internal redirects
 */
function validateVanityJsonc(content: ContentStructure, _logger: Logger): ValidationError[] {
  const errors: ValidationError[] = []
  const vanityPath = path.join(process.cwd(), "content/vanity.jsonc")

  const vanityConfig = loadJsonc<VanityEntry[]>(vanityPath)
  if (!vanityConfig) {
    errors.push({
      type: "error",
      path: "content/vanity.jsonc",
      message: "vanity.jsonc not found",
      fixable: false,
    })
    return errors
  }

  // Build set of valid internal paths
  const validPaths = new Set<string>()

  // Add article paths
  for (const articlePath of content.allArticlePaths) {
    validPaths.add(`/articles/${articlePath}`)
  }

  // Add category paths
  for (const categoryId of content.categories) {
    validPaths.add(`/articles/${categoryId}`)
  }

  // Add topic paths
  for (const [categoryId, topicIds] of content.topics) {
    for (const topicId of topicIds) {
      validPaths.add(`/articles/${categoryId}/${topicId}`)
    }
  }

  // Add known special pages
  validPaths.add("/articles")
  validPaths.add("/topics")
  validPaths.add("/browse")
  validPaths.add("/")

  // Validate internal redirects
  for (const entry of vanityConfig) {
    if (entry.target.startsWith("/")) {
      if (!validPaths.has(entry.target)) {
        errors.push({
          type: "error",
          path: "content/vanity.jsonc",
          message: `Invalid internal redirect target: ${entry.id} -> ${entry.target}`,
          fixable: false,
        })
      }
    }
  }

  return errors
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const logger = new Logger()
  const args = process.argv.slice(2)
  const shouldFix = args.includes("--fix")

  logger.log("=".repeat(60), "INFO")
  logger.log("Content Validation", "INFO")
  logger.log("=".repeat(60), "INFO")
  logger.log(`Content directory: ${CONTENT_DIR}`, "INFO")
  if (shouldFix) {
    logger.log("Fix mode: enabled (not yet implemented)", "WARN")
  }
  logger.log("", "INFO")

  // Discover content structure
  logger.log("Discovering content structure...", "INFO")
  const content = discoverContent()
  logger.log(`Found ${content.categories.length} categories`, "INFO")
  logger.log(`Found ${content.allTopicIds.length} topics`, "INFO")
  logger.log(`Found ${content.allArticleSlugs.length} articles`, "INFO")
  logger.log("", "INFO")

  // Run validators
  const allErrors: ValidationError[] = []

  logger.log("Validating H1 headings...", "INFO")
  const h1Errors = validateH1Headings(logger)
  allErrors.push(...h1Errors)
  logger.log(`  ${h1Errors.length} issues found`, h1Errors.length > 0 ? "WARN" : "SUCCESS")

  logger.log("Validating ordering.jsonc...", "INFO")
  const orderingErrors = validateOrderingJsonc(content, logger)
  allErrors.push(...orderingErrors)
  logger.log(`  ${orderingErrors.length} issues found`, orderingErrors.length > 0 ? "WARN" : "SUCCESS")

  logger.log("Validating home.jsonc...", "INFO")
  const homeErrors = validateHomeJsonc(content, logger)
  allErrors.push(...homeErrors)
  logger.log(`  ${homeErrors.length} issues found`, homeErrors.length > 0 ? "WARN" : "SUCCESS")

  logger.log("Validating vanity.jsonc...", "INFO")
  const vanityErrors = validateVanityJsonc(content, logger)
  allErrors.push(...vanityErrors)
  logger.log(`  ${vanityErrors.length} issues found`, vanityErrors.length > 0 ? "WARN" : "SUCCESS")

  logger.log("", "INFO")

  // Report errors
  const errors = allErrors.filter((e) => e.type === "error")
  const warnings = allErrors.filter((e) => e.type === "warning")

  if (allErrors.length > 0) {
    logger.log("Issues found:", "INFO")
    logger.log("", "INFO")

    for (const error of errors) {
      logger.log(`  [ERROR] ${error.path}: ${error.message}`, "ERROR")
    }
    for (const warning of warnings) {
      logger.log(`  [WARN]  ${warning.path}: ${warning.message}`, "WARN")
    }
    logger.log("", "INFO")
  }

  // Summary
  logger.log("=".repeat(60), "INFO")
  logger.log("Validation Summary", "INFO")
  logger.log("=".repeat(60), "INFO")
  logger.log(`Categories: ${content.categories.length}`, "INFO")
  logger.log(`Topics: ${content.allTopicIds.length}`, "INFO")
  logger.log(`Articles: ${content.allArticleSlugs.length}`, "INFO")
  logger.log(`Errors: ${errors.length}`, errors.length > 0 ? "ERROR" : "INFO")
  logger.log(`Warnings: ${warnings.length}`, warnings.length > 0 ? "WARN" : "INFO")

  if (errors.length === 0 && warnings.length === 0) {
    logger.log("All validations passed!", "SUCCESS")
  } else if (errors.length === 0) {
    logger.log("No errors, but warnings present", "WARN")
  } else {
    logger.log("Validation failed with errors", "ERROR")
  }

  logger.save()

  // Exit with error code if there were errors
  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error("Validation failed:", err)
  process.exit(1)
})
