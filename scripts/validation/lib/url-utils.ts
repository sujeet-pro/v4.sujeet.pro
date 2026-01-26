import * as path from "node:path"

export type UrlKind = "link" | "image" | "resource"

export const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "bmp", "ico", "apng"])

export const RESOURCE_EXTENSIONS = new Set([
  "css",
  "js",
  "mjs",
  "json",
  "xml",
  "xsl",
  "txt",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "map",
  "webmanifest",
  "pdf",
  "mp4",
  "webm",
  "mp3",
  "m4a",
])

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#x22;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function normalizeUrl(rawUrl: string): string {
  return decodeHtmlEntities(rawUrl.trim())
}

export function stripHash(url: string): string {
  const hashIndex = url.indexOf("#")
  if (hashIndex === -1) return url
  return url.slice(0, hashIndex)
}

export function stripQueryAndHash(url: string): string {
  const hashless = stripHash(url)
  const queryIndex = hashless.indexOf("?")
  if (queryIndex === -1) return hashless
  return hashless.slice(0, queryIndex)
}

export function isSkippableUrl(url: string): boolean {
  if (!url) return true
  return (
    url.startsWith("#") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("javascript:") ||
    url.startsWith("data:")
  )
}

export function isHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://")
}

export function isProtocolRelative(url: string): boolean {
  return url.startsWith("//")
}

export function normalizeProtocolRelative(url: string): string {
  if (!isProtocolRelative(url)) return url
  return `https:${url}`
}

export function getUrlPathname(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export function getUrlExtension(url: string): string | null {
  const pathname = getUrlPathname(stripQueryAndHash(url))
  const ext = path.extname(pathname)
  if (!ext) return null
  return ext.replace(".", "").toLowerCase()
}

export function hasAssetExtension(url: string): boolean {
  const ext = getUrlExtension(url)
  if (!ext) return false
  return IMAGE_EXTENSIONS.has(ext) || RESOURCE_EXTENSIONS.has(ext)
}

export function classifyByExtension(url: string, fallback: UrlKind): UrlKind {
  const ext = getUrlExtension(url)
  if (!ext) return fallback
  if (IMAGE_EXTENSIONS.has(ext)) return "image"
  if (RESOURCE_EXTENSIONS.has(ext)) return "resource"
  if (ext === "html") return "link"
  return fallback
}

export function parseSrcset(value: string): string[] {
  const urls: string[] = []
  for (const item of value.split(",")) {
    const trimmed = item.trim()
    if (!trimmed) continue
    const [url] = trimmed.split(/\s+/)
    if (url) urls.push(url)
  }
  return urls
}

export function isSameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin
  } catch {
    return false
  }
}
