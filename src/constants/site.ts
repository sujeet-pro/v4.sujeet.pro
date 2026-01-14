/**
 * Site-wide constants - single source of truth for metadata
 *
 * IMPORTANT: This file handles both static constants and environment-based configuration.
 * Environment variables are used for deployment-specific values (URL, base path).
 * Static constants are used for values that never change (author info, social links).
 */

// =============================================================================
// ENVIRONMENT-BASED CONFIGURATION
// =============================================================================

/**
 * Get environment variable with fallback
 * In Astro, import.meta.env is available at build time
 */
function getEnv(key: string, fallback: string): string {
  return (import.meta.env[key] as string | undefined) ?? fallback
}

/**
 * Normalize base path to ensure consistent format
 * - Empty or "/" returns "/"
 * - "/path" becomes "/path/"
 * - "/path/" stays "/path/"
 */
function normalizeBasePath(path: string): string {
  if (!path || path === "/") return "/"
  const normalized = path.startsWith("/") ? path : `/${path}`
  return normalized.endsWith("/") ? normalized : `${normalized}/`
}

// Site origin (protocol + domain)
const siteOrigin = getEnv("SITE_ORIGIN", "https://sujeet.pro")

// Base path (for subdirectory deployments like GitHub Pages)
const siteBasePath = normalizeBasePath(getEnv("SITE_BASE_PATH", "/"))

// Canonical origin (for SEO)
const canonicalOrigin = getEnv("SITE_CANONICAL_ORIGIN", siteOrigin)

/**
 * Whether site is deployed to a subdirectory (non-root base path)
 */
export const IS_SUBDIRECTORY_DEPLOYMENT = siteBasePath !== "/"

/**
 * Site configuration derived from environment
 */
export const SITE = {
  /** Site origin without trailing slash (e.g., "https://sujeet.pro") */
  origin: siteOrigin.replace(/\/$/, ""),

  /** Base path with leading and trailing slashes (e.g., "/" or "/repo-name/") */
  basePath: siteBasePath,

  /** Full base URL (origin + base path, no trailing slash) */
  baseUrl: `${siteOrigin.replace(/\/$/, "")}${siteBasePath}`.replace(/\/$/, ""),

  /** Canonical origin for SEO (usually same as origin) */
  canonicalOrigin: canonicalOrigin.replace(/\/$/, ""),

  /** Site name for display */
  name: "Sujeet Jaiswal",

  /** Full site title */
  title: "Sujeet Jaiswal - Frontend Principal Engineer",

  /** Site description for SEO */
  description:
    "Personal blog and portfolio of Sujeet Jaiswal, a Frontend Principal Engineer crafting exceptional user experiences through innovative frontend architecture and scalable design systems.",

  /** Language code */
  language: "en-US",

  /** Locale for Open Graph */
  locale: "en_US",
} as const

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Build a full URL from a path, respecting base path configuration
 *
 * @param path - Path relative to site root (e.g., "/writing/my-post")
 * @param options - URL building options
 * @returns Full URL string
 *
 * @example
 * // With SITE_BASE_PATH="/"
 * buildUrl("/writing/post") // "https://sujeet.pro/writing/post"
 *
 * // With SITE_BASE_PATH="/blog/"
 * buildUrl("/writing/post") // "https://sujeet.pro/blog/writing/post"
 */
export function buildUrl(
  path: string,
  options: {
    /** Use canonical origin instead of site origin */
    canonical?: boolean
    /** Include base path (default: true) */
    includeBasePath?: boolean
    /** Absolute URL (default: true) - if false, returns path only */
    absolute?: boolean
  } = {},
): string {
  const { canonical = false, includeBasePath = true, absolute = true } = options

  // Normalize path to not start with /
  const normalizedPath = path.replace(/^\//, "")

  // Build the path portion
  let fullPath: string
  if (includeBasePath && IS_SUBDIRECTORY_DEPLOYMENT) {
    // For subdirectory deployments, prepend base path
    fullPath = `${SITE.basePath}${normalizedPath}`
  } else {
    fullPath = `/${normalizedPath}`
  }

  // Return path only if not absolute
  if (!absolute) {
    return fullPath
  }

  // Build full URL
  const origin = canonical ? SITE.canonicalOrigin : SITE.origin
  return `${origin}${fullPath}`
}

/**
 * Build a path for use in href attributes (respects base path)
 * This is the function to use for all internal links
 *
 * @example
 * <a href={buildPath("/writing")}>Writing</a>
 * // With base "/" -> "/writing"
 * // With base "/blog/" -> "/blog/writing"
 */
export function buildPath(path: string): string {
  return buildUrl(path, { absolute: false })
}

/**
 * Build canonical URL for SEO
 */
export function buildCanonicalUrl(path: string): string {
  return buildUrl(path, { canonical: true })
}

/**
 * Build asset URL (images, fonts, etc.)
 * Assets are always relative to base path
 */
export function buildAssetUrl(assetPath: string): string {
  // Remove leading slash for consistency
  const normalizedPath = assetPath.replace(/^\//, "")

  if (IS_SUBDIRECTORY_DEPLOYMENT) {
    return `${SITE.basePath}${normalizedPath}`
  }
  return `/${normalizedPath}`
}

// =============================================================================
// STATIC CONSTANTS (Never change between environments)
// =============================================================================

export const AUTHOR = {
  name: "Sujeet Jaiswal",
  email: "sujeet.profession@gmail.com",
  title: "Frontend Principal Engineer",
  bio: "Crafting exceptional user experiences through innovative frontend architecture, scalable design systems, and cutting-edge web technologies.",
  /** Relative path to author image - use buildAssetUrl() when rendering */
  image: "/images/sujeet-jaiswal.jpg",
  social: {
    twitter: {
      handle: "@sujeetpro",
      url: "https://twitter.com/sujeetpro",
    },
    github: {
      handle: "sujeet-pro",
      url: "https://github.com/sujeet-pro",
    },
    linkedin: {
      handle: "sujeetkrjaiswal",
      url: "https://www.linkedin.com/in/sujeetkrjaiswal/",
    },
  },
} as const

/**
 * Organization info for JSON-LD
 * Uses dynamic URL building
 */
export const ORGANIZATION = {
  name: "Sujeet Jaiswal",
  get url() {
    return SITE.baseUrl
  },
  get logo() {
    return buildUrl("/favicon-192x192.png")
  },
} as const

/**
 * Navigation items for header
 * Use buildPath() when rendering these links
 */
export const NAV_ITEMS = [
  { path: "/writing", label: "Writing" },
  { path: "/deep-dives", label: "Deep Dives" },
  { path: "/work", label: "Work" },
  { path: "/uses", label: "Uses" },
] as const

/** Content type labels for display */
export const CONTENT_TYPE_LABELS = {
  writing: "Writing",
  "deep-dive": "Deep Dive",
  work: "Work",
  uses: "Uses",
} as const
