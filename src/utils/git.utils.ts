/**
 * Git-based date utilities for content
 *
 * Batch-computes last modified dates from git history for all content files.
 * Results are cached per build — computed once and reused.
 */

import { execSync } from "node:child_process"
import path from "node:path"

let cachedMap: Map<string, string> | null = null

/**
 * Get a map of content file paths to their last modified ISO dates from git.
 * Runs a single `git log` command and parses the output.
 *
 * @returns Map<relativePath, isoDate> where relativePath is relative to repo root
 */
export function getGitLastModifiedMap(): Map<string, string> {
  if (cachedMap) return cachedMap

  cachedMap = new Map<string, string>()

  try {
    const output = execSync('git log --format="format:%aI" --name-only -- "content/"', {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    })

    let currentDate = ""
    for (const line of output.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // ISO date lines start with a digit (e.g., "2024-01-15T...")
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        currentDate = trimmed
      } else if (currentDate && trimmed.startsWith("content/")) {
        // File path line — first occurrence is the most recent date
        if (!cachedMap.has(trimmed)) {
          cachedMap.set(trimmed, currentDate)
        }
      }
    }
  } catch {
    // Git unavailable or error — return empty map
  }

  return cachedMap
}

/**
 * Get the last modified date for a specific file path.
 *
 * @param filePath - Absolute or repo-relative file path
 * @returns ISO date string or undefined
 */
export function getLastModifiedDate(filePath: string): string | undefined {
  const map = getGitLastModifiedMap()

  // Try the path as-is first
  const direct = map.get(filePath)
  if (direct) return direct

  // Try making it relative to the repo root
  const repoRoot = process.cwd()
  const relative = path.relative(repoRoot, filePath)
  return map.get(relative)
}
