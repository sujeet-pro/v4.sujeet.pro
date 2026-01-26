import * as fs from "node:fs"
import * as path from "node:path"

export interface MarkdownWalkOptions {
  includeHidden?: boolean
}

export function getMarkdownFiles(dir: string, options: MarkdownWalkOptions = {}): string[] {
  const files: string[] = []
  const includeHidden = options.includeHidden ?? true

  const walk = (current: string) => {
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      if (!includeHidden && entry.name.startsWith(".")) {
        continue
      }
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

export function loadMarkdownContents(files: string[]): Map<string, string> {
  const contents = new Map<string, string>()
  for (const file of files) {
    contents.set(file, fs.readFileSync(file, "utf-8"))
  }
  return contents
}

export function filterReadmeFiles(files: string[]): string[] {
  return files.filter((file) => path.basename(file) === "README.md")
}

export function collectReadmeFiles(dir: string, options: MarkdownWalkOptions = {}): string[] {
  return filterReadmeFiles(getMarkdownFiles(dir, { includeHidden: options.includeHidden ?? false }))
}
