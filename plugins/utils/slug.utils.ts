import path from "node:path"

/**
 * Get slug for content files (articles, blogs, projects)
 *
 * Articles: content/articles/<category>/<topic>/<post-slug>/README.md → <category>/<topic>/<post-slug>
 * Blogs: content/blogs/<blog-slug>/README.md → <blog-slug>
 * Projects: content/projects/<project-slug>/README.md → <project-slug>
 *
 * For README.md files (category/topic index):
 *   Category: content/articles/<category>/README.md → <category>
 *   Topic: content/articles/<category>/<topic>/README.md → <category>/<topic>
 */
export function getSlug(filePath: string): string {
  // All files should be README.md
  if (!filePath.endsWith("README.md")) {
    throw new Error(`Expected README.md file: ${filePath}`)
  }

  // Try articles folder first (original behavior)
  const articlesFolder = path.resolve("./content/articles")
  const blogsFolder = path.resolve("./content/blogs")
  const projectsFolder = path.resolve("./content/projects")

  for (const folder of [articlesFolder, blogsFolder, projectsFolder]) {
    const relativePath = path.relative(folder, filePath)
    if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
      const dir = path.dirname(relativePath)
      return dir === "." ? "" : dir
    }
  }

  throw new Error(`File path is not within a known content folder: ${filePath}`)
}
