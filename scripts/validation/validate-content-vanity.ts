import * as fs from "node:fs"
import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { CONTENT_DIR, discoverContent, type ContentStructure } from "./lib/content"
import { loadJsonc } from "./lib/jsonc"
import { Logger } from "./lib/logger"

export interface VanityEntry {
  id: string
  target: string
}

interface VanityIssue {
  message: string
}

export interface ContentVanityValidationOptions {
  vanityConfig?: VanityEntry[] | null
  content?: ContentStructure
}

export async function runContentVanityValidation(options: ContentVanityValidationOptions = {}) {
  const logger = new Logger("validate-content-vanity", { humanReadable: true })
  const vanityPath = path.join(process.cwd(), "content/vanity.json5")
  const vanityRelative = path.relative(process.cwd(), vanityPath)

  logger.info("=".repeat(60))
  logger.info("Content Vanity Validation")
  logger.info("=".repeat(60))
  logger.info(`Vanity file: ${vanityRelative}`)
  logger.info("")

  const hasVanityConfig = Object.prototype.hasOwnProperty.call(options, "vanityConfig")
  const vanityConfig = hasVanityConfig ? options.vanityConfig : loadJsonc<VanityEntry[]>(vanityPath)
  if (!vanityConfig) {
    logger.error("vanity.json5 not found")
    const summary = {
      schemaVersion: 1,
      tool: "validate-content-vanity",
      status: "fail",
      generatedAt: new Date().toISOString(),
      summary: {
        issues: 1,
        filesWithIssues: 1,
      },
      files: [
        {
          file: vanityRelative,
          issues: [{ message: "vanity.json5 not found" }],
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
      tool: "validate-content-vanity",
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
  const validPaths = new Set<string>()

  for (const articlePath of content.allArticlePaths) {
    validPaths.add(`/articles/${articlePath}`)
  }

  for (const categoryId of content.categories) {
    validPaths.add(`/articles/${categoryId}`)
  }

  for (const [categoryId, topicIds] of content.topics) {
    for (const topicId of topicIds) {
      validPaths.add(`/articles/${categoryId}/${topicId}`)
    }
  }

  validPaths.add("/articles")
  validPaths.add("/browse")
  validPaths.add("/")

  const issues: VanityIssue[] = []

  for (const entry of vanityConfig) {
    if (entry.target.startsWith("/")) {
      if (!validPaths.has(entry.target)) {
        issues.push({ message: `Invalid internal redirect target: ${entry.id} -> ${entry.target}` })
      }
    }
  }

  if (issues.length > 0) {
    logger.error(`Vanity issues found: ${issues.length}`)
    for (const issue of issues) {
      logger.error(issue.message)
    }
  } else {
    logger.success("vanity.json5 internal redirects are valid.")
  }

  const summary = {
    schemaVersion: 1,
    tool: "validate-content-vanity",
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
              file: vanityRelative,
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
  runContentVanityValidation()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
