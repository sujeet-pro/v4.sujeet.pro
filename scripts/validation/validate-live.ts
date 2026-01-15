/**
 * Live Site Validation Script
 *
 * Validates a running/deployed site by crawling from a landing page:
 * - Checks all asset URLs return 200 (fonts, CSS, JS, images)
 * - Checks all internal page links return 200
 * - Validates paths respect the configured base path
 *
 * Usage:
 *   npx tsx scripts/validation/validate-live.ts
 *
 * Logs are saved to: logs/validate-live-{timestamp}.log
 */

import * as fs from "fs"
import * as path from "path"
import * as readline from "readline"

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

async function promptInput(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer.trim() || defaultValue || "")
    })
  })
}

async function promptSelection(question: string, options: string[]): Promise<number> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log(`\n${question}`)
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`))

  return new Promise((resolve) => {
    rl.question("\nEnter choice (number): ", (answer) => {
      rl.close()
      const index = parseInt(answer) - 1
      if (index >= 0 && index < options.length) {
        resolve(index)
      } else {
        resolve(0)
      }
    })
  })
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

function extractLinks(html: string, baseUrl: string, basePath: string): { assets: Set<string>; pages: Set<string> } {
  const assets = new Set<string>()
  const pages = new Set<string>()
  const origin = new URL(baseUrl).origin

  // Extract href attributes
  const hrefRegex = /href="([^"]+)"/g
  let match
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1]

    // Skip external, anchors, mailto
    if (href.startsWith("mailto:") || href.startsWith("#")) continue
    if (href.startsWith("http") && !href.startsWith(origin)) continue

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
      // Internal page
      const urlPath = new URL(fullUrl).pathname
      if (basePath === "" || urlPath.startsWith(basePath) || urlPath === "/") {
        pages.add(fullUrl)
      }
    }
  }

  // Extract src attributes
  const srcRegex = /src="([^"]+)"/g
  while ((match = srcRegex.exec(html)) !== null) {
    const src = match[1]
    if (src.startsWith("data:")) continue
    if (src.startsWith("http") && !src.startsWith(origin)) continue

    try {
      const fullUrl = new URL(src, baseUrl).href
      if (fullUrl.startsWith(origin)) {
        assets.add(fullUrl)
      }
    } catch {
      continue
    }
  }

  // Extract url() in inline styles
  const urlRegex = /url\(["']?([^"')]+)["']?\)/g
  while ((match = urlRegex.exec(html)) !== null) {
    const url = match[1]
    if (url.startsWith("data:") || url.startsWith("#")) continue

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
  processor: (item: T) => Promise<R>
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

  logger.log("=".repeat(60), "INFO")
  logger.log("Live Site Validation", "INFO")
  logger.log("=".repeat(60), "INFO")

  // Select deployment mode
  const modeIndex = await promptSelection("Select deployment mode to validate:", [
    "Root path (Cloudflare) - e.g., https://sujeet.pro",
    "Base path (GitHub Pages) - e.g., https://projects.sujeet.pro/v4.sujeet.pro/",
    "Local preview (root) - http://localhost:4321",
    "Local preview (base path) - http://localhost:4321/v4.sujeet.pro/",
  ])

  const presets = [
    { url: "https://sujeet.pro", basePath: "" },
    { url: "https://projects.sujeet.pro/v4.sujeet.pro/", basePath: "/v4.sujeet.pro" },
    { url: "http://localhost:4321", basePath: "" },
    { url: "http://localhost:4321/v4.sujeet.pro/", basePath: "/v4.sujeet.pro" },
  ]

  const preset = presets[modeIndex]
  const landingPage = await promptInput("Enter landing page URL", preset.url)
  const basePath = modeIndex % 2 === 1 ? "/v4.sujeet.pro" : ""

  logger.log(`\nValidating: ${landingPage}`, "INFO")
  logger.log(`Base path: "${basePath || "/"}"`, "INFO")
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
  const { assets, pages } = extractLinks(landingHtml, landingPage, basePath)

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
      const { assets: pageAssets, pages: pagePages } = extractLinks(html, pageUrl, basePath)
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
    }
  )

  // Validate all assets
  logger.log("Validating assets...", "INFO")
  const assetResults: ValidationResult[] = await processInBatches(
    Array.from(allAssets),
    MAX_CONCURRENT_REQUESTS,
    async (url) => {
      const { status, ok } = await checkUrl(url)
      return { url, status, type: "asset" as const, error: ok ? undefined : `HTTP ${status}` }
    }
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

  // Validate base path consistency
  logger.log("\nBase Path Validation:", "INFO")
  const incorrectPaths: string[] = []

  for (const url of [...visitedPages, ...allAssets]) {
    const urlPath = new URL(url).pathname
    // Skip _astro paths as Astro handles them
    if (urlPath.startsWith("/_astro") || urlPath.startsWith("/_")) continue

    if (basePath && !urlPath.startsWith(basePath) && urlPath !== "/") {
      incorrectPaths.push(url)
    }
  }

  if (incorrectPaths.length > 0) {
    logger.log(`\nPaths missing base prefix (${incorrectPaths.length}):`, "WARN")
    for (const url of incorrectPaths.slice(0, 10)) {
      logger.log(`  ${url}`, "WARN")
    }
    if (incorrectPaths.length > 10) {
      logger.log(`  ... and ${incorrectPaths.length - 10} more`, "WARN")
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
