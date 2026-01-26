import type { UrlKind } from "./url-utils"
import { classifyByExtension, isSkippableUrl, normalizeUrl, parseSrcset } from "./url-utils"

export interface ExtractedUrl {
  url: string
  kind: UrlKind
  source: string
}

function stripCodeBlocks(html: string): string {
  let cleaned = html
  // Remove code payloads embedded in copy-to-clipboard attributes.
  cleaned = cleaned.replace(/\sdata-code=(["'])[\s\S]*?\1/gi, "")
  cleaned = cleaned.replace(/\sdata-clipboard-text=(["'])[\s\S]*?\1/gi, "")
  cleaned = cleaned.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, "")
  cleaned = cleaned.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, "")
  cleaned = cleaned.replace(/<samp[^>]*>[\s\S]*?<\/samp>/gi, "")
  cleaned = cleaned.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, "$1</script>")
  return cleaned
}

function pushUrl(results: ExtractedUrl[], rawUrl: string, kind: UrlKind, source: string) {
  const normalized = normalizeUrl(rawUrl)
  if (!normalized || isSkippableUrl(normalized)) return
  results.push({ url: normalized, kind, source })
}

export function extractHtmlUrls(html: string): ExtractedUrl[] {
  const results: ExtractedUrl[] = []
  const cleaned = stripCodeBlocks(html)

  const anchorHrefRegex = /<a\b[^>]*\bhref=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = anchorHrefRegex.exec(cleaned)) !== null) {
    const href = match[1]
    if (!href) continue
    pushUrl(results, href, "link", "a.href")
  }

  const linkTagRegex = /<link\b[^>]*>/gi
  while ((match = linkTagRegex.exec(cleaned)) !== null) {
    const tag = match[0]
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
    if (!hrefMatch) continue
    const href = hrefMatch[1]
    if (!href) continue
    const relMatch = tag.match(/rel=["']([^"']+)["']/i)
    if (relMatch?.[1]) {
      const rel = relMatch[1].toLowerCase()
      if (rel.includes("preconnect") || rel.includes("dns-prefetch")) {
        continue
      }
    }
    const kind = classifyByExtension(href, "resource")
    pushUrl(results, href, kind, "link.href")
  }

  const imgSrcRegex = /<img\b[^>]*\bsrc=["']([^"']+)["']/gi
  while ((match = imgSrcRegex.exec(cleaned)) !== null) {
    const src = match[1]
    if (!src) continue
    pushUrl(results, src, "image", "img.src")
  }

  const imgSrcsetRegex = /<img\b[^>]*\bsrcset=["']([^"']+)["']/gi
  while ((match = imgSrcsetRegex.exec(cleaned)) !== null) {
    const srcset = match[1]
    if (!srcset) continue
    for (const url of parseSrcset(srcset)) {
      pushUrl(results, url, "image", "img.srcset")
    }
  }

  const sourceSrcRegex = /<source\b[^>]*\bsrc=["']([^"']+)["']/gi
  while ((match = sourceSrcRegex.exec(cleaned)) !== null) {
    const src = match[1]
    if (!src) continue
    const kind = classifyByExtension(src, "resource")
    pushUrl(results, src, kind, "source.src")
  }

  const sourceSrcsetRegex = /<source\b[^>]*\bsrcset=["']([^"']+)["']/gi
  while ((match = sourceSrcsetRegex.exec(cleaned)) !== null) {
    const srcset = match[1]
    if (!srcset) continue
    for (const url of parseSrcset(srcset)) {
      const kind = classifyByExtension(url, "resource")
      pushUrl(results, url, kind, "source.srcset")
    }
  }

  const scriptSrcRegex = /<script\b[^>]*\bsrc=["']([^"']+)["']/gi
  while ((match = scriptSrcRegex.exec(cleaned)) !== null) {
    const src = match[1]
    if (!src) continue
    pushUrl(results, src, "resource", "script.src")
  }

  const iframeSrcRegex = /<iframe\b[^>]*\bsrc=["']([^"']+)["']/gi
  while ((match = iframeSrcRegex.exec(cleaned)) !== null) {
    const src = match[1]
    if (!src) continue
    const kind = classifyByExtension(src, "resource")
    pushUrl(results, src, kind, "iframe.src")
  }

  const mediaSrcRegex = /<(video|audio)\b[^>]*\bsrc=["']([^"']+)["']/gi
  while ((match = mediaSrcRegex.exec(cleaned)) !== null) {
    const tag = match[1]
    const src = match[2]
    if (!tag || !src) continue
    const kind = classifyByExtension(src, "resource")
    pushUrl(results, src, kind, `${tag}.src`)
  }

  const posterRegex = /<video\b[^>]*\bposter=["']([^"']+)["']/gi
  while ((match = posterRegex.exec(cleaned)) !== null) {
    const poster = match[1]
    if (!poster) continue
    pushUrl(results, poster, "image", "video.poster")
  }

  const urlRegex = /url\(["']?([^"')]+)["']?\)/gi
  while ((match = urlRegex.exec(cleaned)) !== null) {
    const url = match[1]
    if (!url) continue
    const kind = classifyByExtension(url, "resource")
    pushUrl(results, url, kind, "style.url")
  }

  return results
}
