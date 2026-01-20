import path from "node:path"

/**
 * Get slug for in-research content (no date handling)
 * Simple structure: content/in-research/<slug>.md or content/in-research/<slug>/index.md
 */
export function getInResearchSlug(filePath: string): string {
  const inResearchFolder = path.resolve("./content/in-research")

  // Get the relative path from in-research folder
  const relativePath = path.relative(inResearchFolder, filePath)

  // If the file is not within the in-research folder, throw an error
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`File path is not within in-research folder: ${filePath}`)
  }

  // Remove file extension from the last part (filename)
  const filename = path.basename(filePath, path.extname(filePath))

  // If it's an index.md file, use the parent folder name as slug
  if (filename.toLowerCase() === "index") {
    const parentDir = path.dirname(relativePath)
    // Handle nested folders: folder/subfolder/index.md -> folder/subfolder
    return parentDir === "." ? "" : parentDir
  }

  // Otherwise, use the filename (without extension) as the slug
  // Handle nested files: folder/file.md -> folder/file
  const dirname = path.dirname(relativePath)
  if (dirname === ".") {
    return filename
  }
  return `${dirname}/${filename}`
}

export function getSlug(filePath: string) {
  const postsFolder = path.resolve("./content/posts")

  // Get the relative path from posts folder using path.relative
  const relativePath = path.relative(postsFolder, filePath)

  // If the file is not within the posts folder, throw an error
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`File path is not within posts folder: ${filePath}`)
  }

  // Remove the first level folder (post-type: deep-dives/notes) from the path
  const pathWithoutFirstLevel = relativePath.replace(/^[^\/]+\//, "")

  // Split the path into parts
  const pathParts = pathWithoutFirstLevel.split("/")

  // Remove file extension from the last part (filename)
  const filename = path.basename(filePath, path.extname(filePath))
  pathParts[pathParts.length - 1] = filename

  // Build slug by processing each path part
  const slugParts: string[] = []
  let foundDate = false
  let folderStructure: string[] = []

  for (let i = 0; i < pathParts.length; i++) {
    let part = pathParts[i]
    if (!part) continue

    // Skip 'index' filenames
    if (i === pathParts.length - 1 && part.toLowerCase() === "index") continue

    // If part is just a date, skip it
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      foundDate = true
      continue
    }

    // If part is date + slug, use only the slug
    const dateSlugMatch = part.match(/^\d{4}-\d{2}-\d{2}-(.+)$/)
    if (dateSlugMatch) {
      foundDate = true
      if (dateSlugMatch[1]) {
        slugParts.push(dateSlugMatch[1])
      }
      continue
    }

    // If we haven't found a date yet, collect folder structure
    if (!foundDate) {
      folderStructure.push(part)
    } else {
      // After finding a date, add to slug parts
      slugParts.push(part)
    }
  }

  // Combine folder structure and slug parts
  let result: string
  if (folderStructure.length > 0) {
    // If we have folder structure, use it as prefix with '/'
    const folderPrefix = folderStructure.join("/")
    const slugSuffix = slugParts.join("-")
    result = slugSuffix ? `${folderPrefix}/${slugSuffix}` : folderPrefix
  } else {
    // No folder structure, just join with '-'
    result = slugParts.join("-")
  }

  // Clean up
  result = result.replace(/^-+/, "").replace(/-+$/, "").replace(/-+/g, "-")
  result = result.replace(/\/-+/, "/").replace(/-+\//, "/")

  return result
}
