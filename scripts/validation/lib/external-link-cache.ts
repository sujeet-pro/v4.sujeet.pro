import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

// Internal domains that should never be cached in external link cache
const INTERNAL_DOMAINS = ["sujeet.pro", "www.sujeet.pro", "localhost", "127.0.0.1"]

function isInternalUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return INTERNAL_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

export interface ExternalLinkCacheEntry {
  status: number | null
  ok: boolean
  lastChecked: string
  error?: string
  hint?: ExternalLinkHint
  manual?: ExternalLinkManualState
}

export interface ExternalLinkCacheFile {
  version: number
  entries: Record<string, ExternalLinkCacheEntry>
}

export type ExternalLinkHint = "fetch-node" | "fetch-browser-agent" | "playwright" | "manual"
export type ExternalLinkManualState = "auto" | true | false

export const DEFAULT_CACHE_PATH = join(process.cwd(), "scripts/validation/cache_data/external-link-cache.json")

export function loadExternalLinkCache(cachePath: string = DEFAULT_CACHE_PATH): ExternalLinkCacheFile {
  if (!existsSync(cachePath)) {
    return { version: 1, entries: {} }
  }

  const raw = readFileSync(cachePath, "utf-8")
  try {
    const parsed = JSON.parse(raw) as ExternalLinkCacheFile
    if (!parsed.entries) {
      return { version: 1, entries: {} }
    }
    return parsed
  } catch {
    return { version: 1, entries: {} }
  }
}

export function saveExternalLinkCache(cache: ExternalLinkCacheFile, cachePath: string = DEFAULT_CACHE_PATH) {
  const sortedEntries = Object.keys(cache.entries)
    .filter((url) => !isInternalUrl(url)) // Filter out internal site URLs
    .sort()
    .reduce<Record<string, ExternalLinkCacheEntry>>((acc, key) => {
      const entry = cache.entries[key]
      if (entry) {
        acc[key] = entry
      }
      return acc
    }, {})

  const payload: ExternalLinkCacheFile = {
    version: cache.version,
    entries: sortedEntries,
  }

  mkdirSync(dirname(cachePath), { recursive: true })
  writeFileSync(cachePath, `${JSON.stringify(payload, null, 2)}\n`)
}

export function pruneExternalLinkCache(cache: ExternalLinkCacheFile, urls: Iterable<string>): number {
  const allowed = new Set(urls)
  let removed = 0
  for (const key of Object.keys(cache.entries)) {
    if (!allowed.has(key)) {
      delete cache.entries[key]
      removed += 1
    }
  }
  return removed
}

export function isCacheFresh(entry: ExternalLinkCacheEntry, now: number, maxAgeMs: number): boolean {
  const lastChecked = Date.parse(entry.lastChecked)
  if (Number.isNaN(lastChecked)) return false
  return now - lastChecked <= maxAgeMs
}

export function normalizeManualState(raw: unknown): ExternalLinkManualState | null {
  if (raw === true || raw === false) return raw
  if (typeof raw === "string") {
    const trimmed = raw.trim().toLowerCase()
    if (trimmed === "true") return true
    if (trimmed === "false") return false
    if (trimmed === "auto") return "auto"
  }
  return null
}
