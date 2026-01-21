import type { Root } from "hast"
import type { Plugin } from "unified"
import path from "node:path"
import fs from "node:fs"
import { getSlug, getInResearchSlug } from "./utils/slug.utils"

/**
 * Rehype plugin that transforms markdown file path links to site URLs.
 *
 * Enables IDE navigation (Cmd+Click) while producing correct URLs in output.
 *
 * Example:
 *   Input:  [Link](../../deep-dives/web-fundamentals/2024-05-12-micro-frontends.md)
 *   Output: [Link](/posts/deep-dives/web-fundamentals/micro-frontends)
 */
const rehypeInternalLinks: Plugin<[], Root> = () => {
  return (tree, file) => {
    const sourceFilePath = file.path
    if (!sourceFilePath) return

    const visit = (node: any) => {
      if (node.type === "element" && node.tagName === "a") {
        const href = node.properties?.href as string | undefined
        if (href && isMarkdownLink(href)) {
          const transformedUrl = transformLink(href, sourceFilePath)
          if (transformedUrl) {
            node.properties.href = transformedUrl
          }
        }
      }
      if (node.children) {
        node.children.forEach(visit)
      }
    }

    visit(tree)
  }
}

/**
 * Check if a link is a markdown file reference that should be transformed.
 */
function isMarkdownLink(href: string): boolean {
  // Skip external URLs, anchors, and protocol links
  if (href.startsWith("http") || href.startsWith("#") || href.includes("://")) {
    return false
  }
  // Check if it's a markdown file reference
  return href.endsWith(".md") || href.includes(".md#")
}

/**
 * Transform a markdown file path to a site URL.
 */
function transformLink(href: string, sourceFilePath: string): string | null {
  // Extract anchor if present
  const [linkPath, anchor] = href.split("#")

  // Resolve relative path to absolute
  const sourceDir = path.dirname(sourceFilePath)
  const absolutePath = path.resolve(sourceDir, linkPath)

  // Verify target exists
  if (!fs.existsSync(absolutePath)) {
    console.warn(`[rehype-internal-links] Target not found: ${absolutePath} (from ${sourceFilePath})`)
    return null
  }

  // Determine if posts or in-research
  const postsDir = path.resolve("./content/posts")
  const inResearchDir = path.resolve("./content/in-research")

  if (absolutePath.startsWith(postsDir + path.sep)) {
    const postType = getPostType(absolutePath)
    const slug = getSlug(absolutePath)
    const url = `/posts/${postType}/${slug}`
    return anchor ? `${url}#${anchor}` : url
  }

  if (absolutePath.startsWith(inResearchDir + path.sep)) {
    const slug = getInResearchSlug(absolutePath)
    const url = `/in-research/${slug}`
    return anchor ? `${url}#${anchor}` : url
  }

  // Link is to a markdown file outside content directories
  console.warn(`[rehype-internal-links] Link target not in content directories: ${absolutePath}`)
  return null
}

/**
 * Extract post type (deep-dives, notes) from file path.
 */
function getPostType(filePath: string): string {
  const postsDir = path.resolve("./content/posts")
  const relativePath = path.relative(postsDir, filePath)
  const parts = relativePath.split(path.sep)
  return parts[0] || "notes"
}

export default rehypeInternalLinks
