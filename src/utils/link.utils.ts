/**
 * Link utility functions for consistent link handling
 */

import { trailingSlash as trailingSlashConfig } from "astro:config/client"

/**
 * Link properties for anchor elements
 */
interface LinkProps {
  href: string
  target?: string | null | undefined
  rel?: string | null | undefined
}

/**
 * Get link properties with proper external link handling
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

  // Internal links: ensure starts with /
  let result = href.startsWith("/") ? href : "/" + href

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
 * Build a file path for assets (fonts, images, etc.)
 */
export function getFilePath(...pathFragments: string[]): string {
  const path = pathFragments
    .map((s) => s.replace(/^\/|\/$/g, ""))
    .filter(Boolean)
    .join("/")
  return "/" + path
}

/**
 * Build a favicon path
 */
export function getFaviconPath(filename: string): string {
  return getFilePath("favicons", filename)
}
