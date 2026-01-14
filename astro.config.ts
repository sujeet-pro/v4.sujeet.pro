import tailwindcss from "@tailwindcss/vite"
import pagefind from "astro-pagefind"
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
import remarkToc from "remark-toc"
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

export default defineConfig({
  site: "https://sujeet.pro",
  base: "/",
  trailingSlash: "ignore",
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
  env: {
    schema: {
      SITE_CANONICAL_ORIGIN: envField.string({ context: "client", access: "public", optional: false }),
      SITE_CANONICAL_PATH: envField.string({ context: "client", access: "public", optional: false }),
    },
  },
  integrations: [
    icon(),
    pagefind({
      indexConfig: {
        verbose: true,
      },
    }),
    sitemap(),
    expressiveCode({}),
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

      [remarkToc, { heading: "Table of Contents", maxDepth: 3, tight: true }],
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
      // [rehypeMermaid, { colorScheme: "light", dark: true, strategy: "img-svg" }],
      [rehypeMermaid, { colorScheme: "light", dark: true, strategy: "pre-mermaid" }],
      rehypeImgClass,
      rehypeTable,
    ],
    gfm: true,
  },
})
