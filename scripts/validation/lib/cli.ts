import * as path from "node:path"
import { fileURLToPath } from "node:url"

export function isDirectRun(importMetaUrl: string): boolean {
  if (!process.argv[1]) return false
  const scriptPath = path.resolve(process.argv[1])
  return fileURLToPath(importMetaUrl) === scriptPath
}
