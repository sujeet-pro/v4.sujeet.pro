import path from "node:path"

export function getSlug(filePath: string) {
  const contentFolder = path.resolve("./content")

  // Get the relative path from content folder using path.relative
  const relativePath = path.relative(contentFolder, filePath)

  // If the file is not within the content folder, throw an error
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`File path is not within content folder: ${filePath}`)
  }

  // Remove the first level folder (posts/pages) from the path
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
