import * as fs from "node:fs"
import * as path from "node:path"
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

async function main() {
  const logger = new Logger("validate-content", { humanReadable: true })
  const contentDirExists = fs.existsSync(CONTENT_DIR)

  logger.info("=".repeat(60))
  logger.info("Content Validation")
  logger.info("=".repeat(60))
  logger.info(`Content directory: ${path.relative(process.cwd(), CONTENT_DIR)}`)
  logger.info("")

  const markdownFiles = contentDirExists ? getMarkdownFiles(CONTENT_DIR, { includeHidden: true }) : undefined
  const fileContents = markdownFiles ? loadMarkdownContents(markdownFiles) : undefined
  const contentStructure = contentDirExists ? discoverContent() : undefined

  const homeConfig = loadJsonc<HomeJsonc>(path.join(process.cwd(), "content/home.jsonc"))
  const orderingConfig = loadJsonc<OrderingJsonc>(path.join(process.cwd(), "content/ordering.jsonc"))
  const vanityConfig = loadJsonc<VanityEntry[]>(path.join(process.cwd(), "content/vanity.jsonc"))

  let exitCode = 0

  const sharedContentOptions: Parameters<typeof runContentH1Validation>[0] = {}
  if (markdownFiles) sharedContentOptions.markdownFiles = markdownFiles
  if (fileContents) sharedContentOptions.fileContents = fileContents

  const h1Result = await runContentH1Validation(sharedContentOptions)
  exitCode = Math.max(exitCode, h1Result.exitCode)

  const linksResult = await runContentLinksValidation(sharedContentOptions)
  exitCode = Math.max(exitCode, linksResult.exitCode)

  const homeResult = await runContentHomeValidation({
    homeConfig,
  })
  exitCode = Math.max(exitCode, homeResult.exitCode)

  const orderingOptions: Parameters<typeof runContentOrderingValidation>[0] = { orderingConfig }
  if (contentStructure) orderingOptions.content = contentStructure
  const orderingResult = await runContentOrderingValidation(orderingOptions)
  exitCode = Math.max(exitCode, orderingResult.exitCode)

  const vanityOptions: Parameters<typeof runContentVanityValidation>[0] = { vanityConfig }
  if (contentStructure) vanityOptions.content = contentStructure
  const vanityResult = await runContentVanityValidation(vanityOptions)
  exitCode = Math.max(exitCode, vanityResult.exitCode)

  const summary = {
    schemaVersion: 1,
    tool: "validate-content",
    status: exitCode > 0 ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      exitCode,
    },
    validators: [
      { tool: "validate-content-h1", summaryPath: path.relative(process.cwd(), h1Result.summaryPath) },
      { tool: "validate-content-links", summaryPath: path.relative(process.cwd(), linksResult.summaryPath) },
      { tool: "validate-content-home", summaryPath: path.relative(process.cwd(), homeResult.summaryPath) },
      { tool: "validate-content-ordering", summaryPath: path.relative(process.cwd(), orderingResult.summaryPath) },
      { tool: "validate-content-vanity", summaryPath: path.relative(process.cwd(), vanityResult.summaryPath) },
    ],
  }
  const summaryPath = logger.saveSummary(summary)

  logger.info("")
  logger.info(`Content validation finished with exit code ${exitCode}.`)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
  logger.save()

  process.exit(exitCode)
}

main().catch((error) => {
  console.error("Validation failed:", error)
  process.exit(1)
})
