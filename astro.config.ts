import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"

import icon from "astro-icon"

import sitemap from "@astrojs/sitemap"

import expressiveCode from "astro-expressive-code"

// Astro Markdown Plugins & Types
import { rehypeHeadingIds } from "@astrojs/markdown-remark"
import type { RehypePlugin } from "node_modules/@astrojs/markdown-remark/dist/types"

// Remark Markdown Plugins
import remarkCodeImport from "remark-code-import"
import remarkEmoji from "remark-emoji"
// @ts-expect-error: No types available for 'remark-inline-svg'
import remarkInlineSvg from "remark-inline-svg"
import remarkMath from "remark-math"
import remarkNormalizeHeadings from "remark-normalize-headings"
// Rehype Markdown Plugins
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeKatex from "rehype-katex"
import rehypeImgClass from "./plugins/rehype-img-class"
// import rehypeSlug from "rehype-slug";

// Custom Plugins
import rehypeMermaid from "rehype-mermaid"
import rehypeTable from "./plugins/rehype-table"
import { remarkCodeTitleUsingFile } from "./plugins/remark-code-title-using-file"
import { remarkFrontmatterPlugin } from "./plugins/remark-frontmatter-plugin"

// https://astro.build/config

/**
 * Site Configuration
 *
 * These values can be overridden via CLI args or environment variables:
 *
 * CLI (recommended for builds):
 *   astro build --site https://example.com --base /subpath/
 *   astro dev --site https://example.com --base /subpath/
 *
 * Environment variables:
 *   SITE_ORIGIN - Full origin URL (e.g., "https://sujeet.pro")
 *   SITE_BASE_PATH - Base path for subdirectory deployments
 *                    Format: Can be "/" or "/path/" or "path" - all are normalized
 *                    Examples: "/v4.sujeet.pro/", "v4.sujeet.pro", "/" (root)
 *
 * Defaults (no env needed):
 *   - Site: https://sujeet.pro
 *   - Base: / (root)
 *   - Canonical: https://sujeet.pro (always points to production)
 */
const siteOrigin = process.env.SITE_ORIGIN || "https://sujeet.pro"
const siteBasePath = process.env.SITE_BASE_PATH || "/"

export default defineConfig({
  // Full site URL (used for sitemap, canonical URLs)
  site: siteOrigin,

  // Base path for assets and links
  base: siteBasePath,

  trailingSlash: "never",
  build: {
    format: "file", // Generate writing.html instead of writing/index.html
  },
  output: "static",
  scopedStyleStrategy: "where",
  prefetch: {
    defaultStrategy: "viewport",
    prefetchAll: true,
  },
  experimental: {
    clientPrerender: true,
    contentIntellisense: true,
    csp: false,
    fonts: [],
    headingIdCompat: true,
  },

  // Redirects for old routes
  redirects: {
    "/post": "/writing",
    "/post/[...slug]": "/writing/[...slug]",
  },

  // Define environment schema for type safety
  env: {
    schema: {
      SITE_ORIGIN: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "https://sujeet.pro",
      }),
      SITE_BASE_PATH: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "/",
      }),
      SITE_CANONICAL_ORIGIN: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "https://sujeet.pro",
      }),
      // Controls draft content visibility
      // - true: Show drafts (for GitHub builds and local dev)
      // - false: Hide drafts (for production/Cloudflare)
      // Defaults to false for production builds
      SHOW_DRAFTS: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
    },
  },
  integrations: [icon(), expressiveCode({}), sitemap()],
  vite: {
    plugins: [tailwindcss() as any],
  },
  markdown: {
    remarkPlugins: [
      [remarkFrontmatterPlugin, { defaultLayout: "@/layout/layout-markdown.astro" }],
      remarkCodeTitleUsingFile,
      [remarkInlineSvg, { className: "md-inline-svg", suffix: ".inline.svg" }],
      [remarkCodeImport, { removeRedundantIndentations: true }] as any,
      remarkMath,
      remarkNormalizeHeadings,
      remarkEmoji,
    ],
    rehypePlugins: [
      rehypeKatex,
      [rehypeAccessibleEmojis as RehypePlugin, { ignore: ["title", "script", "style", "svg", "math", "pre", "code"] }],
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          headingProperties: { class: "heading-with-deep-link" },
          properties: { ariaHidden: true, tabIndex: -1, class: "deep-link" },
        },
      ],
      [rehypeMermaid, { strategy: "inline-svg", mermaidConfig: { theme: "default" } }],
      rehypeImgClass,
      rehypeTable,
    ],
    gfm: true,
  },
})
