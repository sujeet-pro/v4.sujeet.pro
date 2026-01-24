import path from "node:path"

/**
 * Get slug for articles and README.md files
 *
 * New structure: content/articles/<category>/<topic>/<post-slug>/README.md
 * Returns: <category>/<topic>/<post-slug>
 *
 * For README.md files (category/topic index):
 *   Category: content/articles/<category>/README.md → <category>
 *   Topic: content/articles/<category>/<topic>/README.md → <category>/<topic>
 *
 * Examples:
 * - content/articles/programming/algo/sorting-algorithms/README.md → programming/algo/sorting-algorithms
 * - content/articles/programming/README.md → programming
 * - content/articles/programming/algo/README.md → programming/algo
 */
export function getSlug(filePath: string): string {
  const articlesFolder = path.resolve("./content/articles")

  // Get the relative path from articles folder
  const relativePath = path.relative(articlesFolder, filePath)

  // If the file is not within the articles folder, throw an error
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`File path is not within articles folder: ${filePath}`)
  }

  // All files should be README.md - return the folder path
  if (!filePath.endsWith("README.md")) {
    throw new Error(`Expected README.md file: ${filePath}`)
  }

  // Remove the README.md filename to get folder path
  const dir = path.dirname(relativePath)
  return dir === "." ? "" : dir
}
