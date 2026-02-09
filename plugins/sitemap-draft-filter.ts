/**
 * Sitemap Draft Filter
 *
 * Excludes draft pages, empty listing pages, in-research content, and vanity URLs from the sitemap.
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
 * - Listing pages with 0 entries (blogs, projects, categories, topics with all-draft articles)
 */

import { ChangeFreqEnum, type SitemapItem } from "@astrojs/sitemap"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { glob } from "glob"
import JSON5 from "json5"

import { getSlug } from "./utils/slug.utils"

/** Content directories */
const ARTICLES_DIR = path.resolve("./content/articles")
const BLOGS_DIR = path.resolve("./content/blogs")
const PROJECTS_DIR = path.resolve("./content/projects")

/** Glob for README.md files (category, topic, and article pages) */
const ARTICLE_GLOB = path.join(ARTICLES_DIR, "**/README.md")

/** Path to vanity URLs file */
const VANITY_FILE_PATH = "./content/vanity.json5"

/** Static pages to always exclude from sitemap */
const EXCLUDED_PATHS = ["/articles/drafts", "/drafts", "/posts/drafts", "/random"]

/** Path prefixes to exclude (all pages under these paths) */
const EXCLUDED_PREFIXES = ["/in-research"]

interface VanityEntry {
  id: string
  target: string
}

/**
 * Get all vanity URL paths from the vanity.json5 file.
 */
function getVanityPaths(): string[] {
  try {
    const content = fs.readFileSync(VANITY_FILE_PATH, "utf-8")
    const entries = JSON5.parse(content) as VanityEntry[]
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
 * Count README.md files in a content directory (non-recursive top-level entries).
 * Each entry is a subdirectory with a README.md file.
 */
function countContentEntries(dir: string): number {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    return entries.filter((entry) => {
      if (!entry.isDirectory()) return false
      const readmePath = path.join(dir, entry.name, "README.md")
      return fs.existsSync(readmePath)
    }).length
  } catch {
    return 0
  }
}

/**
 * Get the depth of an article file relative to the articles directory.
 * depth 1 = category index (category/README.md)
 * depth 2 = topic index (category/topic/README.md)
 * depth 3 = article (category/topic/slug/README.md)
 */
function getArticleDepth(filePath: string): number {
  const relativePath = path.relative(ARTICLES_DIR, filePath)
  const dir = path.dirname(relativePath)
  if (dir === ".") return 0
  return dir.split(path.sep).length
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

  // Exclude empty listing pages: /blogs, /projects, /tags
  const blogCount = countContentEntries(BLOGS_DIR)
  const projectCount = countContentEntries(PROJECTS_DIR)
  if (blogCount === 0) {
    addExcludedPath(exclusions, siteUrl, "/blogs")
  }
  if (projectCount === 0) {
    addExcludedPath(exclusions, siteUrl, "/projects")
  }
  // Tags are derived from blogs and projects — exclude if both are empty
  if (blogCount === 0 && projectCount === 0) {
    addExcludedPath(exclusions, siteUrl, "/tags")
  }

  // Scan article files — track drafts and non-draft article counts per category/topic
  const files = await glob(ARTICLE_GLOB)

  // Track which categories and topics have at least one non-draft article
  const categoryHasArticles = new Set<string>()
  const topicHasArticles = new Set<string>()
  const allCategories = new Set<string>()
  const allTopics = new Set<string>()

  for (const file of files) {
    const depth = getArticleDepth(file)
    const slug = getSlug(file)
    const draft = isDraftFile(file)

    if (depth === 1) {
      // Category index — track it; exclude if draft
      allCategories.add(slug)
      if (draft) addExcludedPath(exclusions, siteUrl, `/articles/${slug}`)
    } else if (depth === 2) {
      // Topic index — track it; exclude if draft
      const categorySlug = slug.split("/")[0]!
      allTopics.add(slug)
      allCategories.add(categorySlug)
      if (draft) addExcludedPath(exclusions, siteUrl, `/articles/${slug}`)
    } else if (depth === 3) {
      // Article — exclude if draft; track non-draft articles for parent listings
      const parts = slug.split("/")
      const categorySlug = parts[0]!
      const topicSlug = `${parts[0]}/${parts[1]}`
      allCategories.add(categorySlug)
      allTopics.add(topicSlug)

      if (draft) {
        addExcludedPath(exclusions, siteUrl, `/articles/${slug}`)
      } else {
        categoryHasArticles.add(categorySlug)
        topicHasArticles.add(topicSlug)
      }
    }
  }

  // Exclude category listing pages with 0 non-draft articles
  for (const category of allCategories) {
    if (!categoryHasArticles.has(category)) {
      addExcludedPath(exclusions, siteUrl, `/articles/${category}`)
    }
  }

  // Exclude topic listing pages with 0 non-draft articles
  for (const topic of allTopics) {
    if (!topicHasArticles.has(topic)) {
      addExcludedPath(exclusions, siteUrl, `/articles/${topic}`)
    }
  }

  // Exclude /articles listing if no non-draft articles exist at all
  if (categoryHasArticles.size === 0) {
    addExcludedPath(exclusions, siteUrl, "/articles")
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
// ─── Sitemap Serialization (lastmod, changefreq, priority) ───────────────────

/** Alias for EnumChangefreq values used in priority/changefreq mapping */
const Freq = ChangeFreqEnum

/**
 * Get the git last-modified date (author date) for a file.
 * Returns ISO 8601 string or null if the file has no git history.
 */
function getGitLastModified(filePath: string): string | null {
  try {
    const result = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()
    return result || null
  } catch {
    return null
  }
}

/**
 * Build a map of URL paths → git last-modified dates by scanning content files.
 * Run once at startup (config evaluation time).
 */
function buildLastmodMap(): Map<string, string> {
  const lastmodMap = new Map<string, string>()

  // Scan all article README.md files
  const articleFiles = glob.sync(path.join(ARTICLES_DIR, "**/README.md"))
  for (const file of articleFiles) {
    const slug = getSlug(file)
    const depth = getArticleDepth(file)

    let urlPath: string
    if (depth === 0) {
      // Shouldn't happen (articles root has no README.md), skip
      continue
    } else if (depth === 1) {
      // Category index
      urlPath = `/articles/${slug}`
    } else if (depth === 2) {
      // Topic index
      urlPath = `/articles/${slug}`
    } else {
      // Article page
      urlPath = `/articles/${slug}`
    }

    const lastmod = getGitLastModified(file)
    if (lastmod) {
      lastmodMap.set(urlPath, lastmod)
    }
  }

  // Scan blog README.md files
  const blogFiles = glob.sync(path.join(BLOGS_DIR, "*/README.md"))
  for (const file of blogFiles) {
    const slug = getSlug(file)
    if (slug) {
      const lastmod = getGitLastModified(file)
      if (lastmod) {
        lastmodMap.set(`/blogs/${slug}`, lastmod)
      }
    }
  }

  // Scan project README.md files
  const projectFiles = glob.sync(path.join(PROJECTS_DIR, "*/README.md"))
  for (const file of projectFiles) {
    const slug = getSlug(file)
    if (slug) {
      const lastmod = getGitLastModified(file)
      if (lastmod) {
        lastmodMap.set(`/projects/${slug}`, lastmod)
      }
    }
  }

  return lastmodMap
}

/** Pre-computed lastmod map (built once at config evaluation time) */
const lastmodMap = buildLastmodMap()
const buildDate = new Date().toISOString()

/**
 * Determine priority and changefreq based on URL pattern.
 */
function getUrlMetadata(urlPath: string): { priority: number; changefreq: ChangeFreqEnum } {
  if (urlPath === "/") {
    return { priority: 1.0, changefreq: Freq.WEEKLY }
  }
  if (urlPath === "/articles") {
    return { priority: 0.9, changefreq: Freq.WEEKLY }
  }

  // Article pages: /articles/<cat>/<topic>/<slug>
  if (urlPath.startsWith("/articles/")) {
    const segments = urlPath.replace("/articles/", "").split("/")
    if (segments.length === 3) {
      // Individual article
      return { priority: 0.8, changefreq: Freq.MONTHLY }
    }
    // Category or topic index (1 or 2 segments)
    return { priority: 0.7, changefreq: Freq.MONTHLY }
  }

  // Blogs, projects, tags listing pages
  if (urlPath === "/blogs" || urlPath === "/projects" || urlPath === "/tags") {
    return { priority: 0.5, changefreq: Freq.MONTHLY }
  }

  // Default
  return { priority: 0.5, changefreq: Freq.MONTHLY }
}

/**
 * Serialize a sitemap item with lastmod, changefreq, and priority.
 * Used as the `serialize` option for @astrojs/sitemap.
 */
export function serializeSitemapItem(item: SitemapItem): SitemapItem {
  const url = new URL(item.url)
  const urlPath = normalizePath(url.pathname)

  const { priority, changefreq } = getUrlMetadata(urlPath)
  const lastmod = lastmodMap.get(urlPath) ?? buildDate

  return {
    ...item,
    lastmod,
    changefreq,
    priority,
  }
}

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
