/**
 * Static Build Validation Script
 *
 * Validates the built HTML files in the dist folder to ensure:
 * - All asset paths (fonts, CSS, JS, images) exist and are correctly prefixed
 * - All internal page links point to existing files
 * - All paths respect the configured base path
 *
 * Usage:
 *   npx tsx scripts/validation/validate-static.ts
 *
 * Logs are saved to: logs/validate-static-{timestamp}.log
 */

import * as fs from "fs"
import * as path from "path"
import * as readline from "readline"

// Configuration
const DIST_DIR = path.join(process.cwd(), "dist")
const LOGS_DIR = path.join(process.cwd(), "logs")

interface ValidationResult {
  file: string
  errors: string[]
  warnings: string[]
}

interface ValidationSummary {
  totalFiles: number
  totalErrors: number
  totalWarnings: number
  results: ValidationResult[]
}

class Logger {
  private logFile: string
  private logs: string[] = []

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    this.logFile = path.join(LOGS_DIR, `validate-static-${timestamp}.log`)
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }

  log(message: string, level: "INFO" | "ERROR" | "WARN" | "SUCCESS" = "INFO") {
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${level}] ${message}`
    this.logs.push(logLine)

    // Console output with colors
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

async function promptSelection(question: string, options: string[]): Promise<string> {
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
        resolve(options[index])
      } else {
        resolve(options[0]) // Default to first option
      }
    })
  })
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

// Skip validation for these patterns (external, special, or example content)
const SKIP_PATTERNS = [
  /^https?:\/\//,
  /^mailto:/,
  /^#/,
  /^data:/,
  /^javascript:/,
  /&#x22;/, // HTML-encoded quotes (from code examples)
  /&#x27;/, // HTML-encoded single quotes
  /&quot;/, // HTML-encoded quotes
  /^["']/, // Starts with quote (likely from code block)
  /my-/i, // Example placeholder names like "my-font.woff2"
  /example/i, // Example placeholder names
  /^[A-Z][a-z]+[A-Z]/, // CamelCase placeholder names like "MyFont.woff2"
  /^(main|app|index|script|style)\.(js|css)$/i, // Common example filenames
]

function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(url))
}

function extractLinks(html: string, basePath: string): { assets: string[]; pages: string[] } {
  const assets: string[] = []
  const pages: string[] = []

  // Extract href attributes
  const hrefRegex = /href="([^"]+)"/g
  let match
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1]
    if (shouldSkip(href)) continue
    if (href.match(/\.(css|woff2?|png|jpg|jpeg|gif|svg|ico|webp|json|xml|xsl|js|mjs)$/i)) {
      assets.push(href)
    } else if (basePath === "" ? href.startsWith("/") : href.startsWith(basePath)) {
      pages.push(href)
    }
  }

  // Extract src attributes
  const srcRegex = /src="([^"]+)"/g
  while ((match = srcRegex.exec(html)) !== null) {
    const src = match[1]
    if (shouldSkip(src)) continue
    assets.push(src)
  }

  // Extract url() in inline styles
  const urlRegex = /url\(["']?([^"')]+)["']?\)/g
  while ((match = urlRegex.exec(html)) !== null) {
    const url = match[1]
    if (shouldSkip(url)) continue
    assets.push(url)
  }

  return { assets: [...new Set(assets)], pages: [...new Set(pages)] }
}

function validateFile(
  filePath: string,
  basePath: string,
  allFiles: Set<string>,
  logger: Logger
): ValidationResult {
  const relativePath = path.relative(DIST_DIR, filePath)
  const errors: string[] = []
  const warnings: string[] = []

  const html = fs.readFileSync(filePath, "utf-8")
  const { assets, pages } = extractLinks(html, basePath)

  // Validate assets
  for (const asset of assets) {
    // Normalize the asset path for checking
    let checkPath = asset

    // Handle base path
    if (basePath && asset.startsWith(basePath)) {
      checkPath = asset.slice(basePath.length)
      if (!checkPath.startsWith("/")) checkPath = "/" + checkPath
    }

    // Check if file exists
    if (!allFiles.has(checkPath) && !allFiles.has(asset)) {
      // Check for .html extension for pages
      if (!allFiles.has(checkPath + ".html") && !allFiles.has(asset + ".html")) {
        errors.push(`Missing asset: ${asset}`)
      }
    }

    // Validate base path prefix
    if (basePath && !asset.startsWith(basePath) && asset.startsWith("/") && !asset.startsWith("/_astro")) {
      // Allow _astro paths without base prefix as Astro handles them
      if (!asset.startsWith("/_")) {
        warnings.push(`Asset missing base path prefix: ${asset} (expected ${basePath}${asset})`)
      }
    }
  }

  // Validate page links
  for (const page of pages) {
    let checkPath = page

    // Handle base path
    if (basePath && page.startsWith(basePath)) {
      checkPath = page.slice(basePath.length)
      if (!checkPath.startsWith("/")) checkPath = "/" + checkPath
    }

    // Check for .html file or directory with index
    const htmlPath = checkPath.endsWith("/") ? checkPath + "index.html" : checkPath + ".html"
    const exactPath = checkPath.endsWith(".html") ? checkPath : null

    if (!allFiles.has(htmlPath) && !allFiles.has(checkPath) && (!exactPath || !allFiles.has(exactPath))) {
      // Also check without .html for flat file format
      const flatPath = checkPath.replace(/\/$/, "") + ".html"
      if (!allFiles.has(flatPath)) {
        errors.push(`Missing page: ${page}`)
      }
    }
  }

  return { file: relativePath, errors, warnings }
}

async function main() {
  const logger = new Logger()

  logger.log("=".repeat(60), "INFO")
  logger.log("Static Build Validation", "INFO")
  logger.log("=".repeat(60), "INFO")

  // Check if dist exists
  if (!fs.existsSync(DIST_DIR)) {
    logger.log("dist folder not found. Run a build first.", "ERROR")
    logger.save()
    process.exit(1)
  }

  // Ask for deployment mode
  const modeChoice = await promptSelection("Select deployment mode to validate:", [
    "Root path (Cloudflare) - paths like /writing",
    "Base path (GitHub Pages) - paths like /v4.sujeet.pro/writing",
  ])

  const basePath = modeChoice.includes("Root path") ? "" : "/v4.sujeet.pro"

  logger.log(`\nValidating for: ${modeChoice}`, "INFO")
  logger.log(`Base path: "${basePath || "/"}"`, "INFO")
  logger.log("", "INFO")

  // Get all files
  const htmlFiles = getAllHtmlFiles(DIST_DIR)
  const allFiles = getAllDistFiles(DIST_DIR)

  logger.log(`Found ${htmlFiles.length} HTML files to validate`, "INFO")
  logger.log(`Found ${allFiles.size} total files in dist`, "INFO")
  logger.log("", "INFO")

  // Validate each file
  const summary: ValidationSummary = {
    totalFiles: htmlFiles.length,
    totalErrors: 0,
    totalWarnings: 0,
    results: [],
  }

  for (const file of htmlFiles) {
    const result = validateFile(file, basePath, allFiles, logger)
    summary.results.push(result)
    summary.totalErrors += result.errors.length
    summary.totalWarnings += result.warnings.length

    if (result.errors.length > 0 || result.warnings.length > 0) {
      logger.log(`\n${result.file}:`, "INFO")
      for (const error of result.errors) {
        logger.log(`  ${error}`, "ERROR")
      }
      for (const warning of result.warnings) {
        logger.log(`  ${warning}`, "WARN")
      }
    }
  }

  // Summary
  logger.log("\n" + "=".repeat(60), "INFO")
  logger.log("Validation Summary", "INFO")
  logger.log("=".repeat(60), "INFO")
  logger.log(`Total files validated: ${summary.totalFiles}`, "INFO")

  if (summary.totalErrors === 0 && summary.totalWarnings === 0) {
    logger.log(`All validations passed!`, "SUCCESS")
  } else {
    logger.log(`Total errors: ${summary.totalErrors}`, summary.totalErrors > 0 ? "ERROR" : "INFO")
    logger.log(`Total warnings: ${summary.totalWarnings}`, summary.totalWarnings > 0 ? "WARN" : "INFO")
  }

  logger.save()

  // Exit with error code if there were errors
  process.exit(summary.totalErrors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error("Validation failed:", err)
  process.exit(1)
})
