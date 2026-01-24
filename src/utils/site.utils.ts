/**
 * Site Configuration Utilities
 *
 * Provides functions to access the site configuration from site.jsonc.
 */

import { getEntry } from "astro:content"

// =============================================================================
// Types
// =============================================================================

export interface NavItem {
  path: string
  label: string
}

export interface SocialLink {
  handle: string
  url: string
}

export interface SiteConfig {
  origin: string
  name: string
  title: string
  description: string
  language: string
  locale: string
  navItems: NavItem[]
  footerLinks: NavItem[]
  social: {
    twitter: SocialLink
    github: SocialLink
    linkedin: SocialLink
  }
  copyright: {
    holder: string
    startYear: number
  }
}

// =============================================================================
// Cached Site Config
// =============================================================================

let cachedSiteConfig: SiteConfig | null = null

/**
 * Get the full site configuration from site.jsonc
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  if (!cachedSiteConfig) {
    const siteEntry = await getEntry("site", "site")
    if (!siteEntry) {
      throw new Error("site.jsonc not found or empty")
    }
    cachedSiteConfig = {
      origin: siteEntry.data.origin,
      name: siteEntry.data.name,
      title: siteEntry.data.title,
      description: siteEntry.data.description,
      language: siteEntry.data.language,
      locale: siteEntry.data.locale,
      navItems: siteEntry.data.navItems,
      footerLinks: siteEntry.data.footerLinks,
      social: siteEntry.data.social,
      copyright: siteEntry.data.copyright,
    }
  }
  return cachedSiteConfig
}

// =============================================================================
// Convenience Accessors
// =============================================================================

/**
 * Get site origin (e.g., "https://sujeet.pro")
 */
export async function getSiteOrigin(): Promise<string> {
  const config = await getSiteConfig()
  return config.origin
}

/**
 * Get navigation items for header
 */
export async function getNavItems(): Promise<NavItem[]> {
  const config = await getSiteConfig()
  return config.navItems
}

/**
 * Get footer links
 */
export async function getFooterLinks(): Promise<NavItem[]> {
  const config = await getSiteConfig()
  return config.footerLinks
}

/**
 * Get social links
 */
export async function getSocialLinks(): Promise<SiteConfig["social"]> {
  const config = await getSiteConfig()
  return config.social
}

/**
 * Get copyright info
 */
export async function getCopyright(): Promise<SiteConfig["copyright"]> {
  const config = await getSiteConfig()
  return config.copyright
}
