/**
 * Link utility functions
 * Handles URL building with base path support for subdirectory deployments
 */

import { base, trailingSlash as trailingSlashConfig } from "astro:config/client"

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
 *
 * @param options - Link configuration
 * @param options.href - The href to process
 * @param options.trailingSlash - Trailing slash behavior (default: from astro config)
 * @param options.target - Link target attribute
 * @param options.rel - Link rel attribute
 * @returns Processed link properties
 *
 * @example
 * // Internal link with base path
 * getLinkProps({ href: "/writing" })
 * // Returns: { href: "/base/writing", target: undefined, rel: undefined }
 *
 * @example
 * // External link with security defaults
 * getLinkProps({ href: "https://example.com" })
 * // Returns: { href: "https://example.com", target: "_blank", rel: "noopener noreferrer" }
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
      href: href,
      target: target ?? "_blank",
      rel: rel ?? "noopener noreferrer",
    }
  }

  // Internal links: apply base path
  if (href === "/") {
    href = "/" + base.replace(/^\//, "")
  } else {
    const basePart = stripSlashes(base)
    if (basePart) {
      href = "/" + basePart + "/" + href.replace(/^\//, "")
    } else {
      href = "/" + href.replace(/^\//, "")
    }
  }

  // Apply trailing slash preference
  if (trailingSlash === "always" && !href.endsWith("/") && href !== "/") {
    href = href + "/"
  } else if (trailingSlash === "never" && href.endsWith("/") && href !== "/") {
    href = href.replace(/\/$/, "")
  }

  return { href, target, rel }
}

/**
 * Build a file path with base path support
 *
 * @param pathFragments - Path segments to join
 * @returns Full path with base prefix
 *
 * @example
 * getFilePath("rss", "styles.xsl")
 * // Returns: "/base/rss/styles.xsl"
 */
export function getFilePath(...pathFragments: string[]): string {
  const path = pathFragments.map(stripSlashes).join("/")
  return getLinkProps({
    href: "/" + path,
    trailingSlash: "never",
  }).href
}

/**
 * Build a favicon path
 *
 * @param filename - Favicon filename
 * @returns Full path to favicon
 */
export function getFaviconPath(filename: string): string {
  return getFilePath("favicons", filename)
}

/**
 * Remove leading and trailing slashes from a string
 */
function stripSlashes(str: string): string {
  return str.replace(/^\//, "").replace(/\/$/, "")
}
