/**
 * Live Site Validation Script
 *
 * Validates a running/deployed site by crawling from a landing page:
 * - Checks all asset URLs return 200 (fonts, CSS, JS, images)
 * - Checks all internal page links return 200
 * - Skips URLs found within code blocks (examples in documentation)
 *
 * Usage:
 *   npx tsx scripts/validation/validate-live.ts <url>
 *
 * Examples:
 *   npx tsx scripts/validation/validate-live.ts http://localhost:4321
 *   npx tsx scripts/validation/validate-live.ts https://sujeet.pro
 *
 * Logs are saved to: logs/validate-live-{timestamp}.log
 */

import * as fs from "fs"
import * as path from "path"

// Configuration
const LOGS_DIR = path.join(process.cwd(), "logs")
const MAX_CONCURRENT_REQUESTS = 10
const REQUEST_TIMEOUT = 10000

interface ValidationResult {
  url: string
  status: number | string
  type: "page" | "asset"
  error?: string
}

class Logger {
  private logFile: string
  private logs: string[] = []

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    this.logFile = path.join(LOGS_DIR, `validate-live-${timestamp}.log`)
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


async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ValidateBot/1.0",
      },
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(url, REQUEST_TIMEOUT)
    if (!response.ok) return null

    // Only parse HTML content - skip text files like llms.txt which contain code examples
    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html")) {
      return null
    }

    return await response.text()
  } catch {
    return null
  }
}

async function checkUrl(url: string): Promise<{ status: number | string; ok: boolean }> {
  try {
    const response = await fetchWithTimeout(url, REQUEST_TIMEOUT)
    return { status: response.status, ok: response.ok }
  } catch (err) {
    return { status: err instanceof Error ? err.message : "Unknown error", ok: false }
  }
}

function stripCodeBlocks(html: string): string {
  // Remove content inside <pre>, <code>, and <script> tags to avoid validating example URLs
  // This handles code blocks in documentation that contain example hrefs/srcs
  let cleaned = html

  // Remove <pre>...</pre> blocks (including nested content)
  cleaned = cleaned.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, "")

  // Remove standalone <code>...</code> that might remain
  cleaned = cleaned.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, "")

  // Remove <script>...</script> blocks
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")

  return cleaned
}

function extractLinks(html: string, baseUrl: string): { assets: Set<string>; pages: Set<string> } {
  const assets = new Set<string>()
  const pages = new Set<string>()
  const origin = new URL(baseUrl).origin

  // Strip code blocks before extracting links to avoid validating example URLs
  const cleanedHtml = stripCodeBlocks(html)

  // Extract href attributes
  const hrefRegex = /href="([^"]+)"/g
  let match
  while ((match = hrefRegex.exec(cleanedHtml)) !== null) {
    const href = match[1]

    // Skip external, anchors, mailto, tel
    if (href.startsWith("mailto:") || href.startsWith("#") || href.startsWith("tel:")) continue
    if (href.startsWith("http") && !href.startsWith(origin)) continue

    // Skip HTML-encoded URLs (often from code examples that weren't fully stripped)
    if (href.includes("&#x")) continue

    // Resolve relative URLs
    let fullUrl: string
    try {
      fullUrl = new URL(href, baseUrl).href
    } catch {
      continue
    }

    // Skip external
    if (!fullUrl.startsWith(origin)) continue

    // Categorize
    if (href.match(/\.(css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|json|xml|xsl|js|mjs)(\?.*)?$/i)) {
      assets.add(fullUrl)
    } else if (!href.startsWith("#")) {
      pages.add(fullUrl)
    }
  }

  // Extract src attributes
  const srcRegex = /src="([^"]+)"/g
  while ((match = srcRegex.exec(cleanedHtml)) !== null) {
    const src = match[1]
    if (src.startsWith("data:")) continue
    if (src.startsWith("http") && !src.startsWith(origin)) continue

    // Skip HTML-encoded URLs
    if (src.includes("&#x")) continue

    try {
      const fullUrl = new URL(src, baseUrl).href
      if (fullUrl.startsWith(origin)) {
        assets.add(fullUrl)
      }
    } catch {
      continue
    }
  }

  // Extract url() in inline styles (only from non-code areas)
  const urlRegex = /url\(["']?([^"')]+)["']?\)/g
  while ((match = urlRegex.exec(cleanedHtml)) !== null) {
    const url = match[1]
    if (url.startsWith("data:") || url.startsWith("#")) continue

    // Skip HTML-encoded URLs
    if (url.includes("&#x")) continue

    try {
      const fullUrl = new URL(url, baseUrl).href
      if (fullUrl.startsWith(origin)) {
        assets.add(fullUrl)
      }
    } catch {
      continue
    }
  }

  return { assets, pages }
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }
  return results
}

async function main() {
  const logger = new Logger()

  // Get URL from CLI argument
  const url = process.argv[2]

  if (!url) {
    console.error("\x1b[31mError: URL argument required\x1b[0m")
    console.error("\nUsage: npx tsx scripts/validation/validate-live.ts <url>")
    console.error("\nExamples:")
    console.error("  npx tsx scripts/validation/validate-live.ts http://localhost:4321")
    console.error("  npx tsx scripts/validation/validate-live.ts https://sujeet.pro")
    process.exit(1)
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    console.error(`\x1b[31mError: Invalid URL: ${url}\x1b[0m`)
    process.exit(1)
  }

  const landingPage = url

  logger.log("=".repeat(60), "INFO")
  logger.log("Live Site Validation", "INFO")
  logger.log("=".repeat(60), "INFO")
  logger.log(`\nValidating: ${landingPage}`, "INFO")
  logger.log("", "INFO")

  // Fetch landing page
  logger.log("Fetching landing page...", "INFO")
  const landingHtml = await fetchHtml(landingPage)
  if (!landingHtml) {
    logger.log(`Failed to fetch landing page: ${landingPage}`, "ERROR")
    logger.save()
    process.exit(1)
  }
  logger.log("Landing page fetched successfully", "SUCCESS")

  // Extract links from landing page
  const { assets, pages } = extractLinks(landingHtml, landingPage)

  logger.log(`Found ${pages.size} page links`, "INFO")
  logger.log(`Found ${assets.size} asset links`, "INFO")
  logger.log("", "INFO")

  // Crawl pages to find more links
  logger.log("Crawling pages for additional links...", "INFO")
  const visitedPages = new Set<string>([landingPage])
  const allAssets = new Set<string>(assets)
  const pagesToVisit = Array.from(pages).filter((p) => !visitedPages.has(p))

  for (const pageUrl of pagesToVisit) {
    if (visitedPages.has(pageUrl)) continue
    visitedPages.add(pageUrl)

    const html = await fetchHtml(pageUrl)
    if (html) {
      const { assets: pageAssets, pages: pagePages } = extractLinks(html, pageUrl)
      pageAssets.forEach((a) => allAssets.add(a))
      pagePages.forEach((p) => {
        if (!visitedPages.has(p) && !pagesToVisit.includes(p)) {
          pagesToVisit.push(p)
        }
      })
    }
  }

  logger.log(`Total pages found: ${visitedPages.size}`, "INFO")
  logger.log(`Total assets found: ${allAssets.size}`, "INFO")
  logger.log("", "INFO")

  // Validate all pages
  logger.log("Validating pages...", "INFO")
  const pageResults: ValidationResult[] = await processInBatches(
    Array.from(visitedPages),
    MAX_CONCURRENT_REQUESTS,
    async (url) => {
      const { status, ok } = await checkUrl(url)
      return { url, status, type: "page" as const, error: ok ? undefined : `HTTP ${status}` }
    },
  )

  // Validate all assets
  logger.log("Validating assets...", "INFO")
  const assetResults: ValidationResult[] = await processInBatches(
    Array.from(allAssets),
    MAX_CONCURRENT_REQUESTS,
    async (url) => {
      const { status, ok } = await checkUrl(url)
      return { url, status, type: "asset" as const, error: ok ? undefined : `HTTP ${status}` }
    },
  )

  // Report results
  logger.log("\n" + "=".repeat(60), "INFO")
  logger.log("Validation Results", "INFO")
  logger.log("=".repeat(60), "INFO")

  const failedPages = pageResults.filter((r) => r.error)
  const failedAssets = assetResults.filter((r) => r.error)

  if (failedPages.length > 0) {
    logger.log(`\nFailed Pages (${failedPages.length}):`, "ERROR")
    for (const result of failedPages) {
      logger.log(`  ${result.status} - ${result.url}`, "ERROR")
    }
  }

  if (failedAssets.length > 0) {
    logger.log(`\nFailed Assets (${failedAssets.length}):`, "ERROR")
    for (const result of failedAssets) {
      logger.log(`  ${result.status} - ${result.url}`, "ERROR")
    }
  }

  // Summary
  logger.log("\n" + "=".repeat(60), "INFO")
  logger.log("Summary", "INFO")
  logger.log("=".repeat(60), "INFO")
  logger.log(`Pages validated: ${pageResults.length}`, "INFO")
  logger.log(`Assets validated: ${assetResults.length}`, "INFO")
  logger.log(`Pages failed: ${failedPages.length}`, failedPages.length > 0 ? "ERROR" : "SUCCESS")
  logger.log(`Assets failed: ${failedAssets.length}`, failedAssets.length > 0 ? "ERROR" : "SUCCESS")

  if (failedPages.length === 0 && failedAssets.length === 0) {
    logger.log("\nAll validations passed!", "SUCCESS")
  }

  logger.save()

  process.exit(failedPages.length + failedAssets.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error("Validation failed:", err)
  process.exit(1)
})
