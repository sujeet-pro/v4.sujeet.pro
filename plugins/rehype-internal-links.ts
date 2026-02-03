import type { Root } from "hast"
import fs from "node:fs"
import path from "node:path"
import type { Plugin } from "unified"
import { getSlug } from "./utils/slug.utils"

/**
 * Rehype plugin that transforms markdown file path links to site URLs.
 *
 * Enables IDE navigation (Cmd+Click) while producing correct URLs in output.
 *
 * Example:
 *   Input:  [Link](../crdt-for-collaborative-systems/README.md)
 *   Output: [Link](/articles/system-design/core-distributed-patterns/crdt-for-collaborative-systems)
 *
 * Usage in markdown:
 *   - Use relative paths with README.md extension: `../sibling-article/README.md`
 *   - This works for both IDE navigation AND produces correct URLs in build
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

  // linkPath should always exist after split, but guard against empty string
  if (!linkPath) return null

  // Resolve relative path to absolute
  const sourceDir = path.dirname(sourceFilePath)
  const absolutePath = path.resolve(sourceDir, linkPath)

  // Verify target exists
  if (!fs.existsSync(absolutePath)) {
    console.warn(`[rehype-internal-links] Target not found: ${absolutePath} (from ${sourceFilePath})`)
    return null
  }

  // Determine if in articles directory
  const articlesDir = path.resolve("./content/articles")

  if (absolutePath.startsWith(articlesDir + path.sep)) {
    const slug = getSlug(absolutePath)
    const url = `/articles/${slug}`
    return anchor ? `${url}#${anchor}` : url
  }

  // Link is to a markdown file outside content directories
  console.warn(`[rehype-internal-links] Link target not in content directories: ${absolutePath}`)
  return null
}

export default rehypeInternalLinks
