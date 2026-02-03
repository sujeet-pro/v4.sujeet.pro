import * as path from "node:path"
import { extractHtmlUrls } from "./html-extract"
import type { UrlKind } from "./url-utils"
import { isHttpUrl, isProtocolRelative, isSameOrigin, normalizeProtocolRelative, stripHash } from "./url-utils"

// Site's own domains - URLs to these are treated as internal, not external
const SITE_DOMAINS = ["sujeet.pro", "www.sujeet.pro"]

/**
 * Check if a URL belongs to the site's own domain
 */
function isSiteDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    return SITE_DOMAINS.includes(hostname)
  } catch {
    return false
  }
}

export interface HtmlUrlRef {
  rawUrl: string
  resolvedUrl: string
  kind: UrlKind
  source: string
  external: boolean
}

interface HtmlRefOptions {
  base: string
  resolve: (rawUrl: string, base: string) => string | null
  isExternal: (resolvedUrl: string, base: string) => boolean
}

function collectHtmlUrlRefs(html: string, options: HtmlRefOptions): HtmlUrlRef[] {
  const refs: HtmlUrlRef[] = []
  const extracted = extractHtmlUrls(html)

  for (const entry of extracted) {
    const rawUrl = stripHash(entry.url)
    if (!rawUrl) continue
    const resolved = options.resolve(rawUrl, options.base)
    if (!resolved) continue
    const resolvedUrl = stripHash(resolved)
    if (!resolvedUrl) continue
    const external = options.isExternal(resolvedUrl, options.base)
    refs.push({
      rawUrl,
      resolvedUrl,
      kind: entry.kind,
      source: entry.source,
      external,
    })
  }

  return refs
}

export function collectHtmlUrlRefsForFile(html: string, sourceFile: string, distDir: string): HtmlUrlRef[] {
  return collectHtmlUrlRefs(html, {
    base: sourceFile,
    resolve: (rawUrl, base) => {
      if (isProtocolRelative(rawUrl)) return normalizeProtocolRelative(rawUrl)
      // Skip site's own domain URLs (canonical, og:url, etc.) - they're self-referential
      if (isHttpUrl(rawUrl) && isSiteDomain(rawUrl)) return null
      if (isHttpUrl(rawUrl)) return rawUrl
      if (rawUrl.startsWith("/")) return path.join(distDir, rawUrl.replace(/^\/+/, ""))
      return path.resolve(path.dirname(base), rawUrl)
    },
    isExternal: (resolvedUrl) => isHttpUrl(resolvedUrl),
  })
}

export interface PageRefOptions {
  /**
   * Production domains that should be treated as internal and rewritten to the target origin.
   * Example: ["sujeet.pro", "www.sujeet.pro"] when validating localhost
   */
  productionDomains?: string[]
}

export function collectHtmlUrlRefsForPage(html: string, pageUrl: string, options?: PageRefOptions): HtmlUrlRef[] {
  const targetOrigin = new URL(pageUrl).origin
  const productionDomains = options?.productionDomains ?? []

  /**
   * Rewrite production domain URLs to target origin for validation.
   * Example: https://sujeet.pro/articles/foo -> http://localhost:4321/articles/foo
   */
  const rewriteToTarget = (url: string): string => {
    try {
      const parsed = new URL(url)
      if (productionDomains.includes(parsed.hostname)) {
        // Rewrite to target origin, preserving path and search
        const targetUrl = new URL(parsed.pathname + parsed.search + parsed.hash, targetOrigin)
        return targetUrl.href
      }
    } catch {
      // Not a valid URL, return as-is
    }
    return url
  }

  return collectHtmlUrlRefs(html, {
    base: pageUrl,
    resolve: (rawUrl, base) => {
      try {
        const resolved = new URL(normalizeProtocolRelative(rawUrl), base).href
        // Rewrite production domain URLs to target
        return rewriteToTarget(resolved)
      } catch {
        return null
      }
    },
    isExternal: (resolvedUrl) => !isSameOrigin(resolvedUrl, targetOrigin),
  })
}
