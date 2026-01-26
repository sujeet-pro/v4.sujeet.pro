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
 * - Static paths like /articles/drafts, /drafts, /posts/drafts
 * - All /in-research/* pages (work in progress content)
 * - All vanity URLs (redirect pages that should not be indexed)
 */

import { glob } from "glob"
import { parse as parseJsonc } from "jsonc-parser"
import fs from "node:fs"
import path from "node:path"
import { getSlug } from "./utils/slug.utils"

/** Articles content directory */
const ARTICLES_DIR = path.resolve("./content/articles")

/** Glob for README.md files (category, topic, and article pages) */
const ARTICLE_GLOB = path.join(ARTICLES_DIR, "**/README.md")

/** Path to vanity URLs file */
const VANITY_FILE_PATH = "./content/vanity.jsonc"

/** Static pages to always exclude from sitemap */
const EXCLUDED_PATHS = ["/articles/drafts", "/drafts", "/posts/drafts"]

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
  if (!h1Match || !h1Match[1]) return false
  return h1Match[1].trim().toLowerCase().startsWith("draft:")
}

function normalizePath(value: string): string {
  if (!value) return "/"
  const trimmed = value.trim().replace(/\/$/, "")
  if (!trimmed) return "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

function normalizePagePath(page: string, siteUrl: string): string {
  if (page.startsWith(siteUrl)) {
    const pathPart = page.slice(siteUrl.length)
    return normalizePath(pathPart || "/")
  }

  if (page.startsWith("http://") || page.startsWith("https://")) {
    try {
      return normalizePath(new URL(page).pathname)
    } catch {
      return normalizePath(page)
    }
  }

  return normalizePath(page)
}

interface SitemapExclusions {
  excludedUrls: Set<string>
  excludedPaths: Set<string>
}

function addExcludedPath(exclusions: SitemapExclusions, siteUrl: string, value: string): void {
  const normalizedPath = normalizePath(value)
  exclusions.excludedPaths.add(normalizedPath)
  exclusions.excludedUrls.add(`${siteUrl}${normalizedPath}`)
}

/**
 * Get all URLs that should be excluded from sitemap.
 */
async function getSitemapExclusions(siteUrl: string): Promise<SitemapExclusions> {
  const exclusions: SitemapExclusions = {
    excludedUrls: new Set<string>(),
    excludedPaths: new Set<string>(),
  }

  // Add static exclusions
  for (const excludedPath of EXCLUDED_PATHS) {
    addExcludedPath(exclusions, siteUrl, excludedPath)
  }

  // Add vanity URL exclusions (redirect pages should not be in sitemap)
  for (const vanityPath of getVanityPaths()) {
    addExcludedPath(exclusions, siteUrl, vanityPath)
  }

  // Scan content files for drafts
  const files = await glob(ARTICLE_GLOB)
  for (const file of files) {
    if (!isDraftFile(file)) continue

    const slug = getSlug(file)
    const urlPath = slug ? `/articles/${slug}` : "/articles"
    addExcludedPath(exclusions, siteUrl, urlPath)
  }

  return exclusions
}

export async function getExcludedUrls(siteUrl: string): Promise<Set<string>> {
  const { excludedUrls } = await getSitemapExclusions(siteUrl)
  return excludedUrls
}

/**
 * Create a sitemap filter function that excludes draft URLs and excluded prefixes.
 */
export async function createSitemapFilter(siteUrl: string): Promise<(page: string) => boolean> {
  const { excludedUrls, excludedPaths } = await getSitemapExclusions(siteUrl)

  return (page: string) => {
    const normalizedPage = page.replace(/\/$/, "")
    const pagePath = normalizePagePath(normalizedPage, siteUrl)

    // Check exact URL matches
    if (excludedUrls.has(normalizedPage) || excludedPaths.has(pagePath)) return false

    // Check prefix matches (e.g., /in-research/*)
    for (const prefix of EXCLUDED_PREFIXES) {
      const normalizedPrefix = normalizePath(prefix)
      if (pagePath === normalizedPrefix || pagePath.startsWith(`${normalizedPrefix}/`)) {
        return false
      }
    }

    return true
  }
}
