import tailwindcss from "@tailwindcss/vite"
import { defineConfig, envField } from "astro/config"

import icon from "astro-icon"

import sitemap from "@astrojs/sitemap"
import { createSitemapFilter } from "./plugins/sitemap-draft-filter"

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
import rehypeInternalLinks from "./plugins/rehype-internal-links"

// Custom Plugins
import rehypeMermaid from "rehype-mermaid"
import rehypeTable from "./plugins/rehype-table"
import { remarkCodeTitleUsingFile } from "./plugins/remark-code-title-using-file"
import { remarkFrontmatterPlugin } from "./plugins/remark-frontmatter-plugin"

// https://astro.build/config
const SITE_URL = "https://sujeet.pro"
const sitemapFilter = await createSitemapFilter(SITE_URL)

export default defineConfig({
  // Full site URL (used for sitemap, canonical URLs)
  site: SITE_URL,

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

  // Define environment schema for type safety
  env: {
    schema: {
      // Controls draft content visibility
      // - true: Show drafts (for local dev)
      // - false: Hide drafts (for production)
      // Defaults to false for production builds
      SHOW_DRAFTS: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
      PUBLIC_SUJEET_PRO_ALGOLIA_APP_ID: envField.string({
        context: "client",
        access: "public",
      }),
      PUBLIC_SUJEET_PRO_ALGOLIA_API_KEY: envField.string({
        context: "client",
        access: "public",
      }),
      PUBLIC_SUJEET_PRO_ALGOLIA_INDEX_NAME: envField.string({
        context: "client",
        access: "public",
      }),
    },
  },
  integrations: [
    icon(),
    expressiveCode({
      shiki: {
        langAlias: {
          redis: "bash",
          vcl: "nginx",
          promql: "plaintext",
          logql: "plaintext",
          bind: "nginx",
        },
      },
    }),
    sitemap({ filter: sitemapFilter }),
  ],
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
      rehypeInternalLinks,
      [
        rehypeKatex,
        {
          strict: (errorCode: string) => (errorCode === "commentAtEnd" ? "ignore" : "warn"),
        },
      ],
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
