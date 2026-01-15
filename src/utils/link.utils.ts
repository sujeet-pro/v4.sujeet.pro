/**
 * Link utility functions
 * Handles URL building with base path support for subdirectory deployments
 *
 * Base path handling:
 * - Input can be: "/", "", undefined, "/path/", "path", "/path"
 * - Output is normalized to: "" (for root) or "/path" (no trailing slash)
 *
 * Examples:
 *   base="/"           -> normalizedBase=""           -> "/writing" stays "/writing"
 *   base=""            -> normalizedBase=""           -> "/writing" stays "/writing"
 *   base="/v4/"        -> normalizedBase="/v4"        -> "/writing" becomes "/v4/writing"
 *   base="v4.sujeet.pro" -> normalizedBase="/v4.sujeet.pro" -> "/writing" becomes "/v4.sujeet.pro/writing"
 */

import { base, trailingSlash as trailingSlashConfig } from "astro:config/client"

/**
 * Normalize base path to "" (root) or "/path" format (no trailing slash)
 * Handles: "/", "", undefined, "/path/", "path", "/path"
 */
function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath || basePath === "/") return ""
  // Strip leading/trailing slashes, then add single leading slash
  const stripped = basePath.replace(/^\/|\/$/g, "")
  return stripped ? "/" + stripped : ""
}

const normalizedBase = normalizeBasePath(base)

/**
 * Link properties for anchor elements
 */
interface LinkProps {
  href: string
  target?: string | null | undefined
  rel?: string | null | undefined
}

/**
 * Get link properties with proper base path and external link handling
 */
export function getLinkProps({
  href,
  trailingSlash = trailingSlashConfig,
  target,
  rel,
}: {
  href: string
  trailingSlash?: "always" | "never" | "ignore"
  target?: string | null | undefined
  rel?: string | null | undefined
}): LinkProps {
  if (!href || typeof href !== "string") {
    return { href, target, rel }
  }

  // External links: add security defaults
  if (href.startsWith("https://")) {
    return {
      href,
      target: target ?? "_blank",
      rel: rel ?? "noopener noreferrer",
    }
  }

  // Internal links: prepend base path
  // Ensure href starts with / for consistent concatenation
  const normalizedHref = href.startsWith("/") ? href : "/" + href
  let result = normalizedBase + normalizedHref

  // Apply trailing slash preference
  if (result !== "/") {
    if (trailingSlash === "always" && !result.endsWith("/")) {
      result = result + "/"
    } else if (trailingSlash === "never" && result.endsWith("/")) {
      result = result.slice(0, -1)
    }
  }

  return { href: result, target, rel }
}

/**
 * Build a file path with base path support (no trailing slash)
 */
export function getFilePath(...pathFragments: string[]): string {
  const path = pathFragments
    .map((s) => s.replace(/^\/|\/$/g, ""))
    .filter(Boolean)
    .join("/")
  return normalizedBase + "/" + path
}

/**
 * Build a favicon path
 */
export function getFaviconPath(filename: string): string {
  return getFilePath("favicons", filename)
}
