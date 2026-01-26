import * as fs from "node:fs"
import * as path from "node:path"
import { isDirectRun } from "./lib/cli"
import { CONTENT_DIR } from "./lib/content"
import {
  loadExternalLinkCache,
  normalizeManualState,
  pruneExternalLinkCache,
  saveExternalLinkCache,
} from "./lib/external-link-cache"
import { validateExternalUrls } from "./lib/external-url-checker"
import { Logger } from "./lib/logger"
import { getMarkdownFiles } from "./lib/markdown"
import { extractMarkdownLinkOccurrences } from "./lib/markdown-links"
import { isHttpUrl, isProtocolRelative, isSkippableUrl, normalizeProtocolRelative } from "./lib/url-utils"

type Mode = "all" | "failed"

function parseMode(args: string[]): Mode | null {
  if (args.includes("--all")) return "all"
  if (args.includes("--failed")) return "failed"
  const modeIndex = args.findIndex((arg) => arg === "--mode")
  if (modeIndex >= 0 && args[modeIndex + 1]) {
    const value = args[modeIndex + 1]?.toLowerCase()
    if (value === "all" || value === "failed") return value
  }
  const modeArg = args.find((arg) => arg.startsWith("--mode="))
  if (modeArg) {
    const [, value] = modeArg.split("=", 2)
    if (value === "all" || value === "failed") return value as Mode
  }
  return null
}

export async function runExternalLinkValidation() {
  const logger = new Logger("validate-external-links", { humanReadable: true })
  const args = process.argv.slice(2)
  const mode = parseMode(args) ?? "failed"

  logger.info("=".repeat(60))
  logger.info("External Link Validation")
  logger.info("=".repeat(60))
  logger.info(`Mode: ${mode}`)

  const contentUrls = collectExternalLinksFromContent()
  const urls = Array.from(contentUrls)
  if (urls.length === 0) {
    logger.warn("No external links found in content.")
    const cache = loadExternalLinkCache()
    const removed = pruneExternalLinkCache(cache, contentUrls)
    if (removed > 0) {
      saveExternalLinkCache(cache)
      logger.info(`Cache pruned: ${removed} stale entr${removed === 1 ? "y" : "ies"} removed.`)
    }
    logger.save()
    return { exitCode: 0 }
  }

  logger.info(`External links in content: ${urls.length}`)
  logger.info("")

  const progressReporter = createProgressReporter(logger)
  const options: Parameters<typeof validateExternalUrls>[1] = {
    onProgress: progressReporter.onProgress,
  }
  if (mode === "all") {
    options.forceFullCheck = true
  }

  const { results, summary } = await validateExternalUrls(urls, options)
  progressReporter.finish()

  const cacheAfterValidation = loadExternalLinkCache()
  const removed = pruneExternalLinkCache(cacheAfterValidation, contentUrls)
  if (removed > 0) {
    saveExternalLinkCache(cacheAfterValidation)
    logger.info(`Cache pruned: ${removed} stale entr${removed === 1 ? "y" : "ies"} removed.`)
  }

  const failures = results.filter((result) => !result.ok)
  const warnings = results.filter((result) => result.warning)

  if (failures.length > 0) {
    logger.error(`Failures: ${failures.length}`)
    for (const failure of failures) {
      logger.error(`${failure.url} -> ${failure.status ?? "Error"}${failure.error ? ` (${failure.error})` : ""}`)
    }
  } else {
    logger.success("No failures found.")
  }

  if (warnings.length > 0) {
    logger.warn(`Warnings: ${warnings.length}`)
    for (const warning of warnings) {
      logger.warn(`${warning.url} - ${warning.warning}`)
    }
  }

  logger.info("")
  logger.info(`Checked: ${summary.checked} (cache: ${summary.fromCache}, warnings: ${summary.warnings})`)

  const cacheAfter = removed > 0 ? cacheAfterValidation : loadExternalLinkCache()
  const manualPending = Object.entries(cacheAfter.entries)
    .filter(([, entry]) => normalizeManualState(entry.manual) === "auto")
    .map(([url]) => url)

  if (manualPending.length > 0) {
    logger.warn("")
    logger.warn(`Manual verification needed: ${manualPending.length}`)
    for (const url of manualPending) {
      logger.warn(url)
    }
  }

  const summaryPayload = {
    schemaVersion: 1,
    tool: "validate-external-links",
    status: failures.length > 0 ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      total: summary.total,
      checked: summary.checked,
      fromCache: summary.fromCache,
      warnings: summary.warnings,
      failures: failures.length,
    },
    failures: failures.map((failure) => ({
      url: failure.url,
      status: failure.status,
      error: failure.error ?? null,
    })),
    warnings: warnings.map((warning) => ({
      url: warning.url,
      warning: warning.warning ?? null,
    })),
  }
  const summaryPath = logger.saveSummary(summaryPayload)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
  logger.save()

  return { exitCode: failures.length > 0 ? 1 : 0 }
}

function collectExternalLinksFromContent(): Set<string> {
  const urls = new Set<string>()
  if (!fs.existsSync(CONTENT_DIR)) return urls

  const markdownFiles = getMarkdownFiles(CONTENT_DIR, { includeHidden: true })
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, "utf-8")
    const occurrences = extractMarkdownLinkOccurrences(content)
    for (const occurrence of occurrences) {
      const rawUrl = occurrence.url
      if (!rawUrl || isSkippableUrl(rawUrl)) continue
      const normalized = isProtocolRelative(rawUrl) ? normalizeProtocolRelative(rawUrl) : rawUrl
      if (!isHttpUrl(normalized)) continue
      urls.add(normalized)
    }
  }

  return urls
}

function createProgressReporter(logger: Logger) {
  const useInline = process.stdout.isTTY
  let lastLoggedAt = 0
  let lastChecked = -1
  let lastLength = 0
  let active = false

  const renderInline = (message: string) => {
    const padded = message + " ".repeat(Math.max(0, lastLength - message.length))
    process.stdout.write(`\r${padded}`)
    lastLength = message.length
  }

  const onProgress = (progress: {
    total: number
    checked: number
    success: number
    failed: number
    inProgress: number
  }) => {
    if (progress.total === 0) return
    const now = Date.now()
    const shouldLog =
      progress.checked === progress.total || (progress.checked !== lastChecked && now - lastLoggedAt >= 800)
    if (!shouldLog) return
    lastLoggedAt = now
    lastChecked = progress.checked
    const message = `Progress: checked ${progress.checked}/${progress.total}, success ${progress.success}, failed ${progress.failed}, in_progress ${progress.inProgress}`
    active = true
    if (useInline) {
      renderInline(message)
    } else {
      logger.info(message)
    }
  }

  const finish = () => {
    if (useInline && active) {
      process.stdout.write("\n")
    }
  }

  return { onProgress, finish }
}

if (isDirectRun(import.meta.url)) {
  runExternalLinkValidation()
    .then(({ exitCode }) => process.exit(exitCode))
    .catch((error) => {
      console.error("External link validation failed:", error)
      process.exit(1)
    })
}
