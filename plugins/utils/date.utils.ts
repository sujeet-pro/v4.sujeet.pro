import path from "node:path"

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return false
  }
  // Check if the date string actually creates the expected date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const reconstructedDate = `${year}-${month}-${day}`
  return reconstructedDate === dateString
}

export function getPublishedDate(filePath: string): Date {
  const contentFolder = path.resolve("./content")

  // Get the relative path from content folder using path.relative
  const relativePath = path.relative(contentFolder, filePath)

  // If the file is not within the content folder, throw an error
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`File path is not within content folder: ${filePath}`)
  }

  // Remove the first level folder (posts/pages) from the path
  const pathWithoutFirstLevel = relativePath.replace(/^[^\/]+\//, "")

  // Check if date is in folder name (YYYY-MM-DD) anywhere in the path
  const folderDateMatch = pathWithoutFirstLevel.match(/(\d{4}-\d{2}-\d{2})/)
  if (folderDateMatch && folderDateMatch[1]) {
    const dateString = folderDateMatch[1]
    if (!isValidDate(dateString)) {
      throw new Error(`Invalid date: ${dateString} in path: ${filePath}`)
    }
    const publishedDate = new Date(dateString)
    return publishedDate
  }

  // Check if date is in filename (YYYY-MM-DD)
  const filename = path.basename(filePath, path.extname(filePath))
  const filenameDateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/)
  if (filenameDateMatch && filenameDateMatch[1]) {
    const dateString = filenameDateMatch[1]
    if (!isValidDate(dateString)) {
      throw new Error(`Invalid date: ${dateString} in filename: ${filePath}`)
    }
    const publishedDate = new Date(dateString)
    return publishedDate
  }

  throw new Error(
    `Invalid date: Invalid date format in path: ${filePath}. Expected either folder pattern: /content/[posts|pages]/YYYY-MM-DD/... or filename pattern: YYYY-MM-DD-*`,
  )
}
