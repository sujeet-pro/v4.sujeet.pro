import type * as mdast from "mdast"
import { toString } from "mdast-util-to-string"
import path from "node:path"
import type { RemarkPlugin } from "node_modules/@astrojs/markdown-remark/dist/types"
import getReadingTime from "reading-time"
import type { VFile } from "vfile"
import { getPublishedDate } from "./utils/date.utils"
import { getSlug } from "./utils/slug.utils"

// Content types that use the 2-level folder structure (content-type/category)
const CONTENT_TYPES = ["writing", "deep-dives", "work", "uses"] as const

/**
 * Extract category from file path
 * Path structure: content/<content-type>/<category>/[optional-nesting/]<date>-<slug>.md
 * Example: content/writing/javascript/2023-05-01-pub-sub.md → category: "javascript"
 * Example: content/deep-dives/system-design/cap-theorem/2024-01-01-index.md → category: "system-design"
 */
function getCategoryFromPath(filePath: string): string | undefined {
  const contentDir = path.resolve("./content")
  if (!filePath.startsWith(contentDir)) {
    return undefined
  }

  const relativePath = path.relative(contentDir, filePath)
  const parts = relativePath.split(path.sep)

  // parts[0] = content-type (writing, deep-dives, etc.)
  // parts[1] = category
  if (parts.length >= 2) {
    const contentType = parts[0]
    if (CONTENT_TYPES.includes(contentType as (typeof CONTENT_TYPES)[number])) {
      return parts[1]
    }
  }

  return undefined
}

export const remarkFrontmatterPlugin: RemarkPlugin = (options: { defaultLayout: string }) => {
  return function (tree: mdast.Root, file: VFile) {
    if (!file.data.astro?.frontmatter) {
      return undefined
    }

    if (!file.path.startsWith(path.resolve("./content"))) {
      file.data.astro.frontmatter.layout ??= options.defaultLayout
    }
    file.data.astro.frontmatter.minutesRead ??= getReadingTime(toString(tree)).text
    const title = getTitle(tree, file) ?? file.data.astro.frontmatter.title
    file.data.astro.frontmatter.title ??= title?.replace(/^draft:\s*/i, "") ?? ""
    file.data.astro.frontmatter.isDraft ??= title?.toLowerCase().trim().startsWith("draft:") ?? false
    file.data.astro.frontmatter.publishedOn ??= getPublishedDate(file.path)
    file.data.astro.frontmatter.description ??= getDescription(tree, file)
    file.data.astro.frontmatter.pageSlug ??= getSlug(file.path)

    // Inject category from path structure (content-type/category/...)
    // This allows the folder structure to define the category without explicit frontmatter
    file.data.astro.frontmatter.category ??= getCategoryFromPath(file.path)
  }
}

function toTextString(tree: mdast.RootContent[]) {
  return toString(
    tree.filter((node) => node.type !== "code"),
    {
      includeHtml: false,
      includeImageAlt: false,
    },
  )
}

function getTitle(tree: mdast.Root, file: VFile) {
  const h1 = tree.children.find((child) => child.type === "heading" && child.depth === 1)

  if (!h1 && import.meta.env.DEV) {
    tree.children.unshift({
      type: "heading",
      depth: 1,
      children: [{ type: "text", value: "Draft: Add title" }],
    })
    return "Draft: Add title"
  }

  if (!h1) {
    throw new Error(`Missing h1 heading in ${file.path}`)
  }

  return toTextString([h1])
}

function getDescription(tree: mdast.Root, file: VFile) {
  // Get h1 index
  const h1Idx = tree.children.findIndex((child) => child.type === "heading" && child.depth === 1)
  if (h1Idx === -1 && !import.meta.env.DEV) {
    throw new Error(`Missing h1 heading in ${file.path}`)
  }

  // Find the first H2 heading after H1
  const firstH2Index = tree.children.findIndex(
    (child, idx) => idx > h1Idx && child.type === "heading" && child.depth === 2,
  )

  // Strategy 1: Get text between H1 and first H2
  if (firstH2Index > h1Idx) {
    const descBetweenH1AndH2 = toTextString(tree.children.slice(h1Idx + 1, firstH2Index))
    if (descBetweenH1AndH2.trim()) {
      return descBetweenH1AndH2.trim()
    }
  }

  // Strategy 2: Find first paragraph anywhere after H1 (handles "Abstract" sections etc.)
  const firstParaIndex = tree.children.findIndex(
    (child, idx) => idx > h1Idx && child.type === "paragraph",
  )
  if (firstParaIndex > h1Idx) {
    const firstPara = tree.children[firstParaIndex]
    if (firstPara) {
      const desc = toTextString([firstPara])
      if (desc.trim()) {
        return desc.trim()
      }
    }
  }

  if (import.meta.env.DEV) {
    return "Draft: Add description"
  }
  throw new Error(`Missing description in ${file.path}`)
}
