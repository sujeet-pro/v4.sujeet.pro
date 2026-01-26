import * as fs from "node:fs"
import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { CONTENT_DIR, discoverContent } from "./lib/content"
import { loadJsonc } from "./lib/jsonc"
import { Logger } from "./lib/logger"
import { getMarkdownFiles, loadMarkdownContents } from "./lib/markdown"
import { runContentH1Validation } from "./validate-content-h1"
import type { HomeJsonc } from "./validate-content-home"
import { runContentHomeValidation } from "./validate-content-home"
import { runContentLinksValidation } from "./validate-content-links"
import type { OrderingJsonc } from "./validate-content-ordering"
import { runContentOrderingValidation } from "./validate-content-ordering"
import type { VanityEntry } from "./validate-content-vanity"
import { runContentVanityValidation } from "./validate-content-vanity"
import { runStaticUrlValidation } from "./validate-static-urls"

type ValidationResult = {
  name: string
  exitCode: number
  summaryPath?: string
  error?: string
}

type SummaryPayload = {
  summary?: {
    issues?: number
    internalIssues?: number
    externalIssues?: number
  }
}

function readSummary(summaryPath?: string): SummaryPayload | null {
  if (!summaryPath) return null
  try {
    const raw = fs.readFileSync(summaryPath, "utf-8")
    return JSON.parse(raw) as SummaryPayload
  } catch {
    return null
  }
}

function getIssueCount(summary: SummaryPayload | null): number {
  const issues = summary?.summary?.issues
  return typeof issues === "number" ? issues : 0
}

async function safeRun(
  name: string,
  runner: () => Promise<{ exitCode: number; summaryPath?: string }>,
): Promise<ValidationResult> {
  try {
    const result = await runner()
    const payload: ValidationResult = { name, exitCode: result.exitCode }
    if (result.summaryPath) {
      payload.summaryPath = result.summaryPath
    }
    return payload
  } catch (error) {
    return {
      name,
      exitCode: 1,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function runValidateAll() {
  const logger = new Logger("validate", { humanReadable: true })

  logger.info("=".repeat(60))
  logger.info("Validation Suite")
  logger.info("=".repeat(60))

  const contentDirExists = fs.existsSync(CONTENT_DIR)
  const markdownFiles = contentDirExists ? getMarkdownFiles(CONTENT_DIR, { includeHidden: true }) : undefined
  const fileContents = markdownFiles ? loadMarkdownContents(markdownFiles) : undefined
  const contentStructure = contentDirExists ? discoverContent() : undefined

  const homeConfig = loadJsonc<HomeJsonc>(path.join(process.cwd(), "content/home.jsonc"))
  const orderingConfig = loadJsonc<OrderingJsonc>(path.join(process.cwd(), "content/ordering.jsonc"))
  const vanityConfig = loadJsonc<VanityEntry[]>(path.join(process.cwd(), "content/vanity.jsonc"))

  const sharedContentOptions: Parameters<typeof runContentH1Validation>[0] = {}
  if (markdownFiles) sharedContentOptions.markdownFiles = markdownFiles
  if (fileContents) sharedContentOptions.fileContents = fileContents

  const results: ValidationResult[] = []

  results.push(await safeRun("content:h1", () => runContentH1Validation(sharedContentOptions)))
  results.push(await safeRun("content:links", () => runContentLinksValidation(sharedContentOptions)))
  results.push(await safeRun("content:home", () => runContentHomeValidation({ homeConfig })))

  const orderingOptions: Parameters<typeof runContentOrderingValidation>[0] = { orderingConfig }
  if (contentStructure) orderingOptions.content = contentStructure
  results.push(await safeRun("content:ordering", () => runContentOrderingValidation(orderingOptions)))

  const vanityOptions: Parameters<typeof runContentVanityValidation>[0] = { vanityConfig }
  if (contentStructure) vanityOptions.content = contentStructure
  results.push(await safeRun("content:vanity", () => runContentVanityValidation(vanityOptions)))

  results.push(await safeRun("static:urls", () => runStaticUrlValidation()))

  const categoryCounts: Array<{ label: string; issues: number }> = []

  for (const result of results) {
    const summary = readSummary(result.summaryPath)
    if (result.name === "static:urls") {
      const internalIssues = summary?.summary?.internalIssues
      const externalIssues = summary?.summary?.externalIssues
      if (typeof internalIssues === "number" || typeof externalIssues === "number") {
        categoryCounts.push({
          label: "static:internal",
          issues: typeof internalIssues === "number" ? internalIssues : 0,
        })
        categoryCounts.push({
          label: "static:external",
          issues: typeof externalIssues === "number" ? externalIssues : 0,
        })
      } else {
        categoryCounts.push({ label: "static:issues", issues: getIssueCount(summary) })
      }
    } else {
      categoryCounts.push({ label: result.name, issues: getIssueCount(summary) })
    }
  }

  const totalIssues = categoryCounts.reduce((acc, entry) => acc + entry.issues, 0)
  const hasFailures = results.some((result) => result.exitCode > 0)

  logger.info("")
  logger.info("Summary")
  for (const entry of categoryCounts) {
    logger.info(`${entry.label}: ${entry.issues}`)
  }
  logger.info(`total: ${totalIssues}`)

  const errorResults = results.filter((result) => result.error)
  if (errorResults.length > 0) {
    logger.warn("")
    logger.warn("Validation crashes")
    for (const result of errorResults) {
      logger.warn(`${result.name}: ${result.error}`)
    }
  }

  const summary = {
    schemaVersion: 1,
    tool: "validate",
    status: hasFailures ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      issues: totalIssues,
      validators: results.length,
    },
    categories: categoryCounts,
    validators: results.map((result) => ({
      tool: result.name,
      exitCode: result.exitCode,
      summaryPath: result.summaryPath ? path.relative(process.cwd(), result.summaryPath) : null,
      error: result.error ?? null,
    })),
  }

  const summaryPath = logger.saveSummary(summary)
  logger.info("")
  logger.info(`Validation finished with exit code ${hasFailures ? 1 : 0}.`)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
  logger.save()

  return { exitCode: hasFailures ? 1 : 0, summaryPath }
}

if (isDirectRun(import.meta.url)) {
  runValidateAll()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
