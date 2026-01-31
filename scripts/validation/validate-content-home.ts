import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { loadJsonc } from "./lib/jsonc"
import { Logger } from "./lib/logger"

export interface HomeJsonc {
  profile?: {
    name?: string
    title?: string
    bio?: string
    imageAlt?: string
  }
  profileActions?: {
    viewCv?: string
    allArticles?: string
  }
}

interface HomeIssue {
  message: string
}

export interface ContentHomeValidationOptions {
  homeConfig?: HomeJsonc | null
}

export async function runContentHomeValidation(options: ContentHomeValidationOptions = {}) {
  const logger = new Logger("validate-content-home", { humanReadable: true })
  const homePath = path.join(process.cwd(), "content/home.json5")
  const homeRelative = path.relative(process.cwd(), homePath)

  logger.info("=".repeat(60))
  logger.info("Content Home Validation")
  logger.info("=".repeat(60))
  logger.info(`Home file: ${homeRelative}`)
  logger.info("")

  const hasHomeConfig = Object.prototype.hasOwnProperty.call(options, "homeConfig")
  const homeConfig = hasHomeConfig ? options.homeConfig : loadJsonc<HomeJsonc>(homePath)
  if (!homeConfig) {
    logger.error("home.json5 not found")
    const summary = {
      schemaVersion: 1,
      tool: "validate-content-home",
      status: "fail",
      generatedAt: new Date().toISOString(),
      summary: {
        issues: 1,
        filesWithIssues: 1,
      },
      files: [
        {
          file: homeRelative,
          issues: [{ message: "home.json5 not found" }],
        },
      ],
    }
    const summaryPath = logger.saveSummary(summary)
    logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
    logger.save()
    return { exitCode: 1, summaryPath }
  }

  const issues: HomeIssue[] = []

  if (!homeConfig.profile) {
    issues.push({ message: "Missing profile object" })
  } else {
    if (!homeConfig.profile.name) issues.push({ message: "Missing profile.name" })
    if (!homeConfig.profile.title) issues.push({ message: "Missing profile.title" })
  }

  if (!homeConfig.profileActions) {
    issues.push({ message: "Missing profileActions object" })
  }

  if (issues.length > 0) {
    logger.error(`Home config issues found: ${issues.length}`)
    for (const issue of issues) {
      logger.error(issue.message)
    }
  } else {
    logger.success("home.json5 structure looks good.")
  }

  const summary = {
    schemaVersion: 1,
    tool: "validate-content-home",
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
              file: homeRelative,
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
  runContentHomeValidation()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
