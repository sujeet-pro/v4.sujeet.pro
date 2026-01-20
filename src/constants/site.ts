/**
 * Site-wide constants - single source of truth for metadata
 */

// =============================================================================
// SITE CONFIGURATION
// =============================================================================

/**
 * Site configuration
 */
export const SITE = {
  /** Site origin without trailing slash */
  origin: "https://sujeet.pro",

  /** Full base URL */
  baseUrl: "https://sujeet.pro",

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
// STATIC CONSTANTS (Never change between environments)
// =============================================================================

export const AUTHOR = {
  name: "Sujeet Jaiswal",
  email: "sujeet.profession@gmail.com",
  title: "Frontend Principal Engineer",
  bio: "Crafting exceptional user experiences through innovative frontend architecture, scalable design systems, and cutting-edge web technologies.",
  /** Relative path to author image */
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
 */
export const ORGANIZATION = {
  name: "Sujeet Jaiswal",
  url: SITE.baseUrl,
  logo: `${SITE.origin}/favicon-192x192.png`,
} as const

/**
 * Navigation items for header
 */
export const NAV_ITEMS = [
  { path: "/deep-dives", label: "Deep Dives" },
  { path: "/notes", label: "Notes" },
] as const

/** Content type labels for display */
export const CONTENT_TYPE_LABELS = {
  "deep-dive": "Deep Dive",
  notes: "Notes",
} as const
