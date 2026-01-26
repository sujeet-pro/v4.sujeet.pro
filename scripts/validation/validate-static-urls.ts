import * as fs from "node:fs"
import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { DEFAULT_CACHE_PATH } from "./lib/external-link-cache"
import { validateExternalUrls } from "./lib/external-url-checker"
import { fetchHtmlFromFile } from "./lib/html-fetch"
import { collectHtmlUrlRefsForFile } from "./lib/html-refs"
import { resolveWithCandidateCache } from "./lib/internal-link-cache"
import { Logger } from "./lib/logger"
import type { UrlKind } from "./lib/url-utils"
import { hasAssetExtension, stripQueryAndHash } from "./lib/url-utils"

const DIST_DIR = path.join(process.cwd(), "dist")

interface UrlReference {
  url: string
  sourceFile: string
  kind: UrlKind
}

interface UrlIssue {
  type: "internal" | "external"
  kind: UrlKind
  url: string
  message: string
  status?: number | null
  error?: string
}

function getAllHtmlFiles(dir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith("_")) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

function getAllDistFiles(dir: string): Set<string> {
  const files = new Set<string>()

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      const relativePath = "/" + path.relative(dir, fullPath).replace(/\\/g, "/")
      if (entry.isDirectory()) {
        walk(fullPath)
      } else {
        files.add(relativePath)
      }
    }
  }

  walk(dir)
  return files
}

function resolveInternalPath(url: string, sourceFile: string): string {
  const cleaned = stripQueryAndHash(url)
  if (cleaned.startsWith("/")) {
    return path.join(DIST_DIR, cleaned.replace(/^\/+/, ""))
  }
  return path.resolve(path.dirname(sourceFile), cleaned)
}

function isInsideDist(targetPath: string): boolean {
  const relative = path.relative(DIST_DIR, targetPath)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

function toDistRelative(targetPath: string): string {
  return "/" + path.relative(DIST_DIR, targetPath).replace(/\\/g, "/")
}

function getInternalCandidates(url: string, sourceFile: string, kind: UrlKind): string[] {
  const cleaned = stripQueryAndHash(url)
  if (!cleaned) return []

  if (cleaned === "/") {
    return [path.join(DIST_DIR, "index.html")]
  }

  const resolved = resolveInternalPath(cleaned, sourceFile)

  if (kind !== "link" || hasAssetExtension(cleaned)) {
    return [resolved]
  }

  const ext = path.extname(cleaned)
  if (ext) {
    return [resolved]
  }

  if (cleaned.endsWith("/")) {
    return [path.join(resolved, "index.html")]
  }

  return [resolved + ".html", path.join(resolved, "index.html")]
}

export async function runStaticUrlValidation() {
  const logger = new Logger("validate-static-urls", { humanReadable: true })

  logger.info("=".repeat(60))
  logger.info("Static Build URL Validation")
  logger.info("=".repeat(60))

  if (!fs.existsSync(DIST_DIR)) {
    logger.error("dist folder not found. Run a build first.")
    const summary = {
      schemaVersion: 1,
      tool: "validate-static-urls",
      status: "fail",
      generatedAt: new Date().toISOString(),
      summary: {
        issues: 1,
        filesWithIssues: 0,
        distDir: path.relative(process.cwd(), DIST_DIR),
      },
      files: [],
      notes: ["dist folder not found. Run a build first."],
    }
    const summaryPath = logger.saveSummary(summary)
    logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
    logger.save()
    return { exitCode: 1, summaryPath, summary }
  }

  const htmlFiles = getAllHtmlFiles(DIST_DIR)
  const allFiles = getAllDistFiles(DIST_DIR)

  const internalRefs: UrlReference[] = []
  const externalRefs: UrlReference[] = []
  const externalUrls = new Set<string>()
  const internalTargets = new Set<string>()
  const uniqueTargets = new Set<string>()
  let totalLinks = 0

  for (const filePath of htmlFiles) {
    const fetched = fetchHtmlFromFile(filePath)
    if (!fetched.ok || !fetched.html) {
      throw new Error(`Failed to read HTML file: ${filePath}`)
    }
    const refs = collectHtmlUrlRefsForFile(fetched.html, filePath, DIST_DIR)

    for (const ref of refs) {
      totalLinks += 1

      if (ref.external) {
        externalRefs.push({ url: ref.resolvedUrl, sourceFile: filePath, kind: ref.kind })
        externalUrls.add(ref.resolvedUrl)
        uniqueTargets.add(ref.resolvedUrl)
        continue
      }

      internalRefs.push({ url: ref.rawUrl, sourceFile: filePath, kind: ref.kind })

      const canonicalResolved = resolveInternalPath(ref.rawUrl, filePath)
      if (isInsideDist(canonicalResolved)) {
        const target = toDistRelative(canonicalResolved)
        internalTargets.add(target)
        uniqueTargets.add(target)
      } else {
        const target = `outside:${ref.rawUrl}`
        internalTargets.add(target)
        uniqueTargets.add(target)
      }
    }
  }

  logger.info(`HTML files scanned: ${htmlFiles.length}`)
  logger.info(`Total links identified: ${totalLinks}`)
  logger.info(`Total unique links: ${uniqueTargets.size}`)
  logger.info(`Unique internal links: ${internalTargets.size}`)
  logger.info(`Unique external links: ${externalUrls.size}`)
  logger.info("")
  logger.info(`External cache: ${path.relative(process.cwd(), DEFAULT_CACHE_PATH)} (delete to revalidate all)`)
  logger.info("")

  const issuesByFile = new Map<string, UrlIssue[]>()
  let internalIssueCount = 0
  let externalIssueCount = 0
  const internalResolutionCache = new Map<string, { outside: boolean; exists: boolean }>()

  const pushIssue = (file: string, issue: UrlIssue) => {
    if (!issuesByFile.has(file)) {
      issuesByFile.set(file, [])
    }
    issuesByFile.get(file)?.push(issue)
    if (issue.type === "internal") {
      internalIssueCount += 1
    } else {
      externalIssueCount += 1
    }
  }

  const seenInternal = new Set<string>()

  for (const ref of internalRefs) {
    const key = `${ref.sourceFile}::${ref.url}::${ref.kind}`
    if (seenInternal.has(key)) continue
    seenInternal.add(key)

    const candidates = getInternalCandidates(ref.url, ref.sourceFile, ref.kind)
    if (candidates.length === 0) continue

    const sourceRelative = path.relative(process.cwd(), ref.sourceFile)
    const resolution = resolveWithCandidateCache(internalResolutionCache, candidates, () => {
      const outside = !candidates.every((candidate) => isInsideDist(candidate))
      const exists = !outside && candidates.some((candidate) => allFiles.has(toDistRelative(candidate)))
      return { outside, exists }
    })

    if (resolution.outside) {
      pushIssue(sourceRelative, {
        type: "internal",
        kind: ref.kind,
        url: ref.url,
        message: "Internal link resolves outside dist",
      })
      continue
    }

    if (!resolution.exists) {
      pushIssue(sourceRelative, {
        type: "internal",
        kind: ref.kind,
        url: ref.url,
        message: "Internal link target missing in dist",
      })
    }
  }

  if (internalIssueCount > 0) {
    logger.error(`Internal link issues: ${internalIssueCount}`)
    const filesWithInternalIssues = Array.from(issuesByFile.entries())
      .map(([file, issues]) => ({
        file,
        issues: issues.filter((issue) => issue.type === "internal"),
      }))
      .filter((entry) => entry.issues.length > 0)
      .sort((a, b) => a.file.localeCompare(b.file))

    for (const entry of filesWithInternalIssues) {
      logger.group(`${entry.file} - ${entry.issues.length} issues`, "ERROR")
      for (const issue of entry.issues) {
        logger.error(`${issue.kind}: ${issue.url} - ${issue.message}`)
      }
      logger.groupEnd()
    }
  } else {
    logger.success("All internal URLs resolve within dist.")
  }

  const externalResults = await validateExternalUrls(Array.from(externalUrls))
  const externalFailures = externalResults.results.filter((result) => !result.ok)
  const externalWarnings = externalResults.results.filter((result) => result.warning)

  logger.info("")
  logger.info(
    `External URLs checked: ${externalResults.summary.total} (cache: ${externalResults.summary.fromCache}, revalidated: ${externalResults.summary.checked})`,
  )

  if (externalWarnings.length > 0) {
    logger.warn(`External link warnings: ${externalWarnings.length}`)
    for (const warning of externalWarnings) {
      logger.warn(`${warning.url} - ${warning.warning}`)
    }
  }

  const externalFailuresMap = new Map(externalFailures.map((failure) => [failure.url, failure]))
  const seenExternal = new Set<string>()

  for (const ref of externalRefs) {
    const failure = externalFailuresMap.get(ref.url)
    if (!failure) continue
    const key = `${ref.sourceFile}::${ref.url}::${ref.kind}`
    if (seenExternal.has(key)) continue
    seenExternal.add(key)
    const sourceRelative = path.relative(process.cwd(), ref.sourceFile)
    const issue: UrlIssue = {
      type: "external",
      kind: ref.kind,
      url: ref.url,
      message: "External URL failed",
      status: failure.status ?? null,
    }
    if (failure.error !== undefined) {
      issue.error = failure.error
    }
    pushIssue(sourceRelative, issue)
  }

  if (externalFailures.length > 0) {
    logger.error(`External link issues: ${externalIssueCount} occurrence(s) across ${externalFailures.length} URL(s)`)
    const filesWithExternalIssues = Array.from(issuesByFile.entries())
      .map(([file, issues]) => ({
        file,
        issues: issues.filter((issue) => issue.type === "external"),
      }))
      .filter((entry) => entry.issues.length > 0)
      .sort((a, b) => a.file.localeCompare(b.file))

    for (const entry of filesWithExternalIssues) {
      logger.group(`${entry.file} - ${entry.issues.length} issues`, "ERROR")
      for (const issue of entry.issues) {
        const hasDetail = issue.status !== null && issue.status !== undefined ? true : !!issue.error
        const detail = hasDetail ? ` (${issue.status ?? "Error"}${issue.error ? `, ${issue.error}` : ""})` : ""
        logger.error(`${issue.kind}: ${issue.url} - ${issue.message}${detail}`)
      }
      logger.groupEnd()
    }
  } else {
    logger.success("All external URLs returned 200.")
  }

  const totalIssues = internalIssueCount + externalIssueCount
  const filesWithIssues = Array.from(issuesByFile.values()).filter((issues) => issues.length > 0).length

  const summary = {
    schemaVersion: 1,
    tool: "validate-static-urls",
    status: totalIssues > 0 ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      issues: totalIssues,
      filesWithIssues,
      internalIssues: internalIssueCount,
      externalIssues: externalIssueCount,
      htmlFiles: htmlFiles.length,
      totalLinks,
      uniqueLinks: uniqueTargets.size,
    },
    files: Array.from(issuesByFile.entries())
      .filter(([, issues]) => issues.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, issues]) => ({
        file,
        issues: issues.map((issue) => ({
          type: issue.type,
          kind: issue.kind,
          url: issue.url,
          message: issue.message,
          status: issue.status ?? null,
          error: issue.error ?? null,
        })),
      })),
  }
  const summaryPath = logger.saveSummary(summary)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)

  logger.save()

  const hasErrors = totalIssues > 0
  return { exitCode: hasErrors ? 1 : 0, summaryPath, summary }
}

if (isDirectRun(import.meta.url)) {
  runStaticUrlValidation()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("Validation failed:", error)
      process.exit(1)
    })
}
