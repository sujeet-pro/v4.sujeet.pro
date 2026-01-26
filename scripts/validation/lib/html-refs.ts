import * as path from "node:path"
import { extractHtmlUrls } from "./html-extract"
import type { UrlKind } from "./url-utils"
import { isHttpUrl, isProtocolRelative, isSameOrigin, normalizeProtocolRelative, stripHash } from "./url-utils"

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
      if (isHttpUrl(rawUrl)) return rawUrl
      if (rawUrl.startsWith("/")) return path.join(distDir, rawUrl.replace(/^\/+/, ""))
      return path.resolve(path.dirname(base), rawUrl)
    },
    isExternal: (resolvedUrl) => isHttpUrl(resolvedUrl),
  })
}

export function collectHtmlUrlRefsForPage(html: string, pageUrl: string): HtmlUrlRef[] {
  const origin = new URL(pageUrl).origin
  return collectHtmlUrlRefs(html, {
    base: pageUrl,
    resolve: (rawUrl, base) => {
      try {
        return new URL(normalizeProtocolRelative(rawUrl), base).href
      } catch {
        return null
      }
    },
    isExternal: (resolvedUrl) => !isSameOrigin(resolvedUrl, origin),
  })
}
