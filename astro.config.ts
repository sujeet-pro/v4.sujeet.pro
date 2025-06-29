import tailwindcss from "@tailwindcss/vite";
import pagefind from "astro-pagefind";
import { defineConfig, envField } from "astro/config";

import icon from "astro-icon";

import sitemap from "@astrojs/sitemap";

import expressiveCode from "astro-expressive-code";

// Astro Markdown Plugins & Types
import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import type { RehypePlugin } from "node_modules/@astrojs/markdown-remark/dist/types";

// Remark Markdown Plugins
import remarkEmoji from "remark-emoji";
import remarkMath from "remark-math";
import remarkNormalizeHeadings from "remark-normalize-headings";
import remarkToc from "remark-toc";

// Rehype Markdown Plugins
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeMermaid from "rehype-mermaid";
// import rehypeSlug from "rehype-slug";

// Custom Plugins
import { remarkFrontmatterPlugin } from "./plugins/remark-frontmatter-plugin";

// https://astro.build/config

export default defineConfig({
  site: "https://projects.sujeet.pro",
  base: "/v4.sujeet.pro/",
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
    responsiveImages: true,
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
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkNormalizeHeadings,
      remarkEmoji,
      [remarkFrontmatterPlugin, { defaultLayout: "@/layout/layout-markdown.astro" }],
      [remarkToc, { heading: "Table of Contents", maxDepth: 3, tight: true }],
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeAccessibleEmojis as RehypePlugin,
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "wrap",
          headingProperties: { class: "heading-with-deep-link" },
          properties: { ariaHidden: true, tabIndex: -1, class: "deep-link" },
        },
      ],
      [rehypeMermaid, { colorScheme: "light", dark: true, strategy: "img-svg" }],
    ],
    gfm: true,
  },
});
