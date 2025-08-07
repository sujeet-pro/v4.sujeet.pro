import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface BlogEntry {
  title: string
  path: string
  publishedOn: Date
}

function extractFrontmatter(content: string): { title?: string; publishedOn?: Date } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return {}

  const frontmatter = frontmatterMatch[1]
  if (!frontmatter) return {}

  const titleMatch = frontmatter.match(/title:\s*["']?([^"\n]+)["']?/)
  const publishedOnMatch = frontmatter.match(/publishedOn:\s*["']?([^"\n]+)["']?/)

  const result: { title?: string; publishedOn?: Date } = {}

  if (titleMatch && titleMatch[1]) {
    result.title = titleMatch[1]
  }

  if (publishedOnMatch && publishedOnMatch[1]) {
    result.publishedOn = new Date(publishedOnMatch[1])
  }

  return result
}

function extractTitleFromContent(content: string): string | null {
  // Look for H1 heading (# Title)
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim()
  }

  // Look for H1 heading with HTML tags
  const h1HtmlMatch = content.match(/<h1[^>]*>(.+?)<\/h1>/)
  if (h1HtmlMatch && h1HtmlMatch[1]) {
    return h1HtmlMatch[1].trim()
  }

  return null
}

function getAllBlogFiles(dir: string, basePath: string = ""): BlogEntry[] {
  const entries: BlogEntry[] = []

  try {
    const items = readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = join(dir, item.name)
      const relativePath = join(basePath, item.name)

      if (item.isDirectory()) {
        // Recursively search directories
        entries.push(...getAllBlogFiles(fullPath, relativePath))
      } else if (item.isFile() && item.name.endsWith(".md") && item.name !== "index.md") {
        // Read the markdown file to extract frontmatter and title
        try {
          const content = readFileSync(fullPath, "utf-8")
          const { title: frontmatterTitle, publishedOn } = extractFrontmatter(content)

          // Try to get title from frontmatter first, then from content
          let title = frontmatterTitle
          if (!title) {
            const contentTitle = extractTitleFromContent(content)
            if (contentTitle) {
              title = contentTitle
            }
          }

          if (title) {
            entries.push({
              title,
              path: relativePath.replace(/\.md$/, ""),
              publishedOn: publishedOn || new Date(0),
            })
          }
        } catch (error) {
          console.warn(`Warning: Could not read ${fullPath}:`, error)
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error)
  }

  return entries
}

async function generateReviewTable() {
  console.log("🚀 Generating blog review table...")

  try {
    const postsDir = join(__dirname, "..", "content", "posts")
    const blogEntries = getAllBlogFiles(postsDir)

    // Sort by publishedOn date (newest first), then by title alphabetically
    blogEntries.sort((a, b) => {
      const dateA = a.publishedOn.getTime()
      const dateB = b.publishedOn.getTime()
      if (dateB !== dateA) {
        return dateB - dateA
      }
      return a.title.localeCompare(b.title)
    })

    // Generate the markdown table
    let tableContent = `# Blog Review Table

| Blog Title | Review Content | Review TLDR | Review Img Caption |
|------------|----------------|-------------|-------------------|
`

    // Add each blog as a row in the table
    for (const blog of blogEntries) {
      const title = blog.title
      const reviewContent = "- [ ]" // Checkbox for review content
      const reviewTLDR = "- [ ]" // Checkbox for review TLDR
      const reviewImgCaption = "- [ ]" // Checkbox for review img caption

      tableContent += `| ${title} | ${reviewContent} | ${reviewTLDR} | ${reviewImgCaption} |\n`
    }

    // Write to the review.md file
    const reviewFilePath = join(__dirname, "..", "content", "raw", "review.md")
    writeFileSync(reviewFilePath, tableContent, "utf-8")

    console.log(`✅ Review table generated with ${blogEntries.length} blog entries`)
    console.log(`📄 File saved to: ${reviewFilePath}`)
  } catch (error) {
    console.error("❌ Error generating review table:", error)
    process.exit(1)
  }
}

generateReviewTable()
