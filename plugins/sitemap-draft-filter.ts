/**
 * Sitemap Draft Filter
 *
 * Excludes draft pages, in-research content, and vanity URLs from the sitemap.
 * This runs before Astro's content layer is available, so we scan files directly.
 *
 * ## How Draft Detection Works
 * A page is considered a draft if its H1 heading starts with "Draft:"
 * This matches the detection logic in remark-frontmatter-plugin.ts
 *
 * ## Excluded Pages
 * - All pages with H1 starting with "Draft:"
 * - Static paths like /drafts, /posts/drafts
 * - All /in-research/* pages (work in progress content)
 * - All vanity URLs (redirect pages that should not be indexed)
 */

import fs from "node:fs"
import path from "node:path"
import { glob } from "glob"
import { parse as parseJsonc } from "jsonc-parser"

/** Content types to scan */
const CONTENT_TYPES = ["writing", "deep-dives", "work", "uses"] as const

/** Path to vanity URLs file */
const VANITY_FILE_PATH = "./content/vanity.jsonc"

/** Static pages to always exclude from sitemap */
const EXCLUDED_PATHS = ["/drafts", "/posts/drafts"]

/** Path prefixes to exclude (all pages under these paths) */
const EXCLUDED_PREFIXES = ["/in-research"]

interface VanityEntry {
  id: string
  target: string
}

/**
 * Get all vanity URL paths from the vanity.jsonc file.
 */
function getVanityPaths(): string[] {
  try {
    const content = fs.readFileSync(VANITY_FILE_PATH, "utf-8")
    const entries = parseJsonc(content) as VanityEntry[]
    return entries.map((entry) => `/${entry.id}`)
  } catch {
    // File doesn't exist or parse error, return empty array
    return []
  }
}

/**
 * Check if a markdown file is a draft by looking for "# Draft:" pattern in H1.
 */
function isDraftFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, "utf-8")
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (!h1Match) return false
  return h1Match[1].trim().toLowerCase().startsWith("draft:")
}

/**
 * Extract slug from file path.
 * Converts: content/writing/javascript/2023-05-01-pub-sub.md
 * To: javascript/pub-sub
 */
function getSlugFromPath(filePath: string): string {
  const contentDir = path.resolve("./content")
  const relativePath = path.relative(contentDir, filePath)
  const parts = relativePath.split(path.sep)

  // Remove content type (first part) and get remaining path
  parts.shift() // Remove content type (writing, deep-dives, etc.)

  // Process the path parts
  const slugParts: string[] = []
  for (const part of parts) {
    // Remove file extension
    const cleanPart = part.replace(/\.md$/, "")

    // Skip 'index' filenames
    if (cleanPart.toLowerCase() === "index") continue

    // Extract slug from date-prefixed filename (e.g., 2023-05-01-pub-sub -> pub-sub)
    const dateSlugMatch = cleanPart.match(/^\d{4}-\d{2}-\d{2}-(.+)$/)
    if (dateSlugMatch && dateSlugMatch[1]) {
      slugParts.push(dateSlugMatch[1])
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanPart)) {
      // Not a date-only part
      slugParts.push(cleanPart)
    }
  }

  return slugParts.join("/")
}

/**
 * Get content type from file path.
 */
function getContentType(filePath: string): string | undefined {
  const contentDir = path.resolve("./content")
  const relativePath = path.relative(contentDir, filePath)
  const parts = relativePath.split(path.sep)
  const contentType = parts[0]
  if (CONTENT_TYPES.includes(contentType as (typeof CONTENT_TYPES)[number])) {
    return contentType
  }
  return undefined
}

/**
 * Get all URLs that should be excluded from sitemap.
 */
export async function getExcludedUrls(siteUrl: string): Promise<Set<string>> {
  const excludedUrls = new Set<string>()

  // Add static exclusions
  for (const excludedPath of EXCLUDED_PATHS) {
    excludedUrls.add(`${siteUrl}${excludedPath}`)
  }

  // Add vanity URL exclusions (redirect pages should not be in sitemap)
  for (const vanityPath of getVanityPaths()) {
    excludedUrls.add(`${siteUrl}${vanityPath}`)
  }

  // Scan content files for drafts
  const contentDir = path.resolve("./content")
  for (const contentType of CONTENT_TYPES) {
    const pattern = path.join(contentDir, contentType, "**/*.md")
    const files = await glob(pattern)

    for (const file of files) {
      if (isDraftFile(file)) {
        const slug = getSlugFromPath(file)
        const type = getContentType(file)
        if (type && slug) {
          excludedUrls.add(`${siteUrl}/${type}/${slug}`)
        }
      }
    }
  }

  return excludedUrls
}

/**
 * Create a sitemap filter function that excludes draft URLs and excluded prefixes.
 */
export async function createSitemapFilter(siteUrl: string): Promise<(page: string) => boolean> {
  const excludedUrls = await getExcludedUrls(siteUrl)

  return (page: string) => {
    const normalizedPage = page.replace(/\/$/, "")

    // Check exact URL matches
    if (excludedUrls.has(normalizedPage)) return false

    // Check prefix matches (e.g., /in-research/*)
    const pagePath = normalizedPage.replace(siteUrl, "")
    for (const prefix of EXCLUDED_PREFIXES) {
      if (pagePath === prefix || pagePath.startsWith(`${prefix}/`)) {
        return false
      }
    }

    return true
  }
}
