import { defineConfig } from "@unlighthouse/cli"

export default defineConfig({
  site: "https://sujeet.pro",
  scanner: {
    // Crawl all pages
    maxRoutes: 300,
    // Skip external links
    skipJavascript: false,
    // Sample dynamic routes
    samples: 3,
  },
  lighthouse: {
    // Run standard Lighthouse audits
    throttling: true,
  },
  // Output configuration
  outputPath: ".unlighthouse",
  // Debug mode for CI
  debug: false,
})
