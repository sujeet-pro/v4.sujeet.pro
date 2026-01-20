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
  title: "Sujeet Jaiswal - Principal Software Engineer",

  /** Site description for SEO */
  description:
    "Personal blog and portfolio of Sujeet Jaiswal, a Principal Software Engineer crafting exceptional user experiences through innovative frontend architecture and scalable design systems.",

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
  title: "Principal Software Engineer",
  /** Short bio for SEO and meta descriptions */
  bio: "Crafting exceptional user experiences through innovative frontend architecture, scalable design systems, and cutting-edge web technologies.",
  /** Detailed bio for profile display */
  profileBio:`
  Principal Software Engineer focused on frontend architecture, 
  design systems, and end-to-end system design, 
  with a strong emphasis on infra and architecture for 
  scale, reliability, and performance.
  `,
  /** Alt text for profile image */
  imageAlt: "Sujeet Jaiswal - Principal Software Engineer",
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
  { path: "/posts/deep-dives", label: "Deep Dives" },
  { path: "/posts/notes", label: "Notes" },
] as const

/** Content type labels for display */
export const CONTENT_TYPE_LABELS = {
  "deep-dive": "Deep Dive",
  notes: "Notes",
  "in-research": "In Research",
} as const

/** Profile action labels */
export const PROFILE_ACTIONS = {
  viewCv: "View CV",
  allPosts: "All Posts",
} as const

/** Profile section labels */
export const PROFILE_LABELS = {
  coreExpertise: "Core Expertise",
} as const
