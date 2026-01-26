import * as fs from "node:fs"
import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { CONTENT_DIR } from "./lib/content"
import { Logger } from "./lib/logger"
import { collectReadmeFiles, filterReadmeFiles } from "./lib/markdown"

interface H1Issue {
  file: string
  message: string
}

function stripMarkdownCode(content: string): string {
  let cleaned = content.replace(/```[\s\S]*?```/g, "")
  cleaned = cleaned.replace(/~~~[\s\S]*?~~~/g, "")
  cleaned = cleaned.replace(/`[^`]*`/g, "")
  return cleaned
}

function validateH1Headings(readmeFiles: string[], fileContents?: Map<string, string>): { issues: H1Issue[] } {
  const issues: H1Issue[] = []

  for (const fullPath of readmeFiles) {
    const content = fileContents?.get(fullPath) ?? fs.readFileSync(fullPath, "utf-8")
    const contentWithoutCode = stripMarkdownCode(content)
    const h1Matches = contentWithoutCode.match(/^#\s+.+$/gm)
    const relativePath = path.relative(process.cwd(), fullPath)

    if (!h1Matches || h1Matches.length === 0) {
      issues.push({
        file: relativePath,
        message: "Missing H1 heading",
      })
    } else if (h1Matches.length > 1) {
      issues.push({
        file: relativePath,
        message: `Multiple H1 headings found (${h1Matches.length})`,
      })
    }
  }

  return { issues }
}

export interface ContentH1ValidationOptions {
  markdownFiles?: string[]
  fileContents?: Map<string, string>
}

export async function runContentH1Validation(options: ContentH1ValidationOptions = {}) {
  const logger = new Logger("validate-content-h1", { humanReadable: true })

  logger.info("=".repeat(60))
  logger.info("Content H1 Validation")
  logger.info("=".repeat(60))
  logger.info(`Content directory: ${path.relative(process.cwd(), CONTENT_DIR)}`)
  logger.info("")

  if (!options.markdownFiles && !fs.existsSync(CONTENT_DIR)) {
    logger.error(`Content directory not found: ${CONTENT_DIR}`)
    const summary = {
      schemaVersion: 1,
      tool: "validate-content-h1",
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

  const markdownFiles = options.markdownFiles ?? collectReadmeFiles(CONTENT_DIR)
  const readmeFiles = filterReadmeFiles(markdownFiles)
  const { issues } = validateH1Headings(readmeFiles, options.fileContents)
  const issuesByFile = new Map<string, H1Issue[]>()
  for (const issue of issues) {
    if (!issuesByFile.has(issue.file)) {
      issuesByFile.set(issue.file, [])
    }
    issuesByFile.get(issue.file)?.push(issue)
  }

  if (issues.length > 0) {
    logger.error(`H1 issues found: ${issues.length}`)
    for (const issue of issues) {
      logger.error(`${issue.file}: ${issue.message}`)
    }
  } else {
    logger.success("All README.md files contain exactly one H1 heading.")
  }

  const summary = {
    schemaVersion: 1,
    tool: "validate-content-h1",
    status: issues.length > 0 ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      issues: issues.length,
      filesWithIssues: issuesByFile.size,
      readmeFiles,
      contentDir: path.relative(process.cwd(), CONTENT_DIR),
    },
    files: Array.from(issuesByFile.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, fileIssues]) => ({
        file,
        issues: fileIssues.map((issue) => ({ message: issue.message })),
      })),
  }
  const summaryPath = logger.saveSummary(summary)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)

  logger.save()
  return { exitCode: issues.length > 0 ? 1 : 0, summaryPath }
}

if (isDirectRun(import.meta.url)) {
  runContentH1Validation()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
