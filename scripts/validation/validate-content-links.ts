import * as fs from "node:fs"
import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { CONTENT_DIR } from "./lib/content"
import { resolveWithCandidateCache } from "./lib/internal-link-cache"
import { Logger } from "./lib/logger"
import { getMarkdownFiles } from "./lib/markdown"
import { extractMarkdownLinkOccurrences } from "./lib/markdown-links"

const DISALLOWED_HOSTS = new Set(["sujeet.pro", "www.sujeet.pro"])

interface LinkIssue {
  file: string
  url: string
  reason: string
  line: number
  context: string
}

// shared Markdown link extraction lives in lib/markdown-links

function isDisallowed(url: string): { disallowed: boolean; reason?: string } {
  if (!url) return { disallowed: false }

  if (url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("data:")) {
    return { disallowed: false }
  }

  if (url.startsWith("//")) {
    const host = url.replace(/^\/\//, "").split("/")[0]
    if (!host) {
      return { disallowed: false }
    }
    if (DISALLOWED_HOSTS.has(host)) {
      return { disallowed: true, reason: "Protocol-relative link to sujeet.pro" }
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const host = new URL(url).hostname
      if (DISALLOWED_HOSTS.has(host)) {
        return { disallowed: true, reason: "Website link to sujeet.pro (use repo-relative)" }
      }
    } catch {
      return { disallowed: true, reason: "Invalid URL format" }
    }
  }

  if (url.startsWith("/")) {
    return { disallowed: true, reason: "Root-relative link (use repo-relative)" }
  }

  if (url.startsWith("sujeet.pro") || url.startsWith("www.sujeet.pro")) {
    return { disallowed: true, reason: "Website link missing protocol (use repo-relative)" }
  }

  return { disallowed: false }
}

function stripQueryAndHash(url: string): string {
  const hashIndex = url.indexOf("#")
  const trimmed = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const queryIndex = trimmed.indexOf("?")
  return queryIndex === -1 ? trimmed : trimmed.slice(0, queryIndex)
}

function isRelativeLink(url: string): boolean {
  if (!url) return false
  if (url.startsWith("#")) return false
  if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("data:")) return false
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//")) return false
  if (url.startsWith("/")) return false
  return true
}

function isExistingFile(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isFile()
  } catch {
    return false
  }
}

function resolveRelativeCandidates(url: string, filePath: string): string[] {
  const cleaned = stripQueryAndHash(url)
  if (!cleaned) return []

  const baseDir = path.dirname(filePath)
  const resolved = path.resolve(baseDir, cleaned)
  const relativeToRepo = path.relative(process.cwd(), resolved)
  if (relativeToRepo.startsWith("..") || path.isAbsolute(relativeToRepo)) {
    return []
  }
  const ext = path.extname(cleaned)
  if (ext) {
    return [resolved]
  }

  return [resolved, `${resolved}.md`, path.join(resolved, "README.md")]
}

export interface ContentLinksValidationOptions {
  markdownFiles?: string[]
  fileContents?: Map<string, string>
}

export async function runContentLinksValidation(options: ContentLinksValidationOptions = {}) {
  const logger = new Logger("validate-content-links", { humanReadable: true })

  logger.info("=".repeat(60))
  logger.info("Content Link Validation")
  logger.info("=".repeat(60))
  logger.info(`Scanning: ${path.relative(process.cwd(), CONTENT_DIR)}`)
  logger.info("")

  if (!options.markdownFiles && !fs.existsSync(CONTENT_DIR)) {
    logger.error(`Content directory not found: ${CONTENT_DIR}`)
    const summary = {
      schemaVersion: 1,
      tool: "validate-content-links",
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

  const markdownFiles = options.markdownFiles ?? getMarkdownFiles(CONTENT_DIR, { includeHidden: true })
  const internalResolutionCache = new Map<string, boolean>()
  let totalLinks = 0
  const uniqueLinks = new Set<string>()
  const issues: LinkIssue[] = []

  for (const filePath of markdownFiles) {
    const content = options.fileContents?.get(filePath) ?? fs.readFileSync(filePath, "utf-8")
    const linkOccurrences = extractMarkdownLinkOccurrences(content)
    const relativeFile = path.relative(process.cwd(), filePath)

    for (const occurrence of linkOccurrences) {
      const link = occurrence.url
      if (!link) continue
      totalLinks += 1
      uniqueLinks.add(link)

      const { disallowed, reason } = isDisallowed(link)
      if (disallowed && reason) {
        issues.push({
          file: relativeFile,
          url: link,
          reason,
          line: occurrence.line,
          context: occurrence.context,
        })
        continue
      }

      if (isRelativeLink(link)) {
        const candidates = resolveRelativeCandidates(link, filePath)
        const exists = resolveWithCandidateCache(internalResolutionCache, candidates, () =>
          candidates.some((candidate) => isExistingFile(candidate)),
        )
        if (!exists) {
          issues.push({
            file: relativeFile,
            url: link,
            reason: "Relative link does not resolve within repo",
            line: occurrence.line,
            context: occurrence.context,
          })
        }
      }
    }
  }

  logger.info(`Markdown files scanned: ${markdownFiles.length}`)
  logger.info(`Total links identified: ${totalLinks}`)
  logger.info(`Total unique links: ${uniqueLinks.size}`)
  logger.info("")

  if (issues.length > 0) {
    logger.error(`Disallowed links found: ${issues.length}`)
    const issuesByFile = new Map<string, LinkIssue[]>()
    for (const issue of issues) {
      if (!issuesByFile.has(issue.file)) {
        issuesByFile.set(issue.file, [])
      }
      issuesByFile.get(issue.file)?.push(issue)
    }

    const sortedFiles = Array.from(issuesByFile.keys()).sort()
    for (const file of sortedFiles) {
      const fileIssues = issuesByFile.get(file) ?? []
      logger.group(`${file} - ${fileIssues.length} wrong urls`, "ERROR")
      for (const issue of fileIssues) {
        logger.error(`${issue.url} - ${issue.reason}`)
        logger.info(`line ${issue.line}: ${issue.context}`)
      }
      logger.groupEnd()
    }
  } else {
    logger.success("All content links are repo-navigable.")
  }

  const filesWithIssues = new Set(issues.map((issue) => issue.file)).size
  logger.info("")
  logger.info(`Summary: ${filesWithIssues} file(s) with issues, ${issues.length} issue(s) total.`)

  const issuesByFileSummary = new Map<string, LinkIssue[]>()
  for (const issue of issues) {
    if (!issuesByFileSummary.has(issue.file)) {
      issuesByFileSummary.set(issue.file, [])
    }
    issuesByFileSummary.get(issue.file)?.push(issue)
  }

  const summary = {
    schemaVersion: 1,
    tool: "validate-content-links",
    status: issues.length > 0 ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      issues: issues.length,
      filesWithIssues,
      markdownFiles: markdownFiles.length,
    },
    files: Array.from(issuesByFileSummary.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, fileIssues]) => ({
        file,
        issues: fileIssues.map((issue) => ({
          url: issue.url,
          reason: issue.reason,
          line: issue.line,
          context: issue.context,
        })),
      })),
  }
  const summaryPath = logger.saveSummary(summary)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)

  logger.save()
  return { exitCode: issues.length > 0 ? 1 : 0, summaryPath }
}

if (isDirectRun(import.meta.url)) {
  runContentLinksValidation()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
