import { existsSync, readFileSync } from "node:fs"

export function parseJsonc<T>(content: string): T {
  const cleaned = content.replace(/"(?:[^"\\]|\\.)*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (match) => {
    if (match.startsWith('"')) return match
    return ""
  })
  const noTrailingCommas = cleaned.replace(/,(\s*[}\]])/g, "$1")
  return JSON.parse(noTrailingCommas) as T
}

export function loadJsonc<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null
  const content = readFileSync(filePath, "utf-8")
  return parseJsonc<T>(content)
}
