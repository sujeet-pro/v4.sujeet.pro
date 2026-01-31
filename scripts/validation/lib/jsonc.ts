import JSON5 from "json5"
import { existsSync, readFileSync } from "node:fs"

export function parseJson5<T>(content: string): T {
  return JSON5.parse(content) as T
}

export function loadJson5<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null
  const content = readFileSync(filePath, "utf-8")
  return parseJson5<T>(content)
}

// Legacy aliases for backward compatibility
export const parseJsonc = parseJson5
export const loadJsonc = loadJson5
