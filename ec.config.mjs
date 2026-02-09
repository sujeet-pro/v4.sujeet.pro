import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import { defineEcConfig } from "astro-expressive-code"

export default defineEcConfig({
  themes: ["github-light", "github-dark"],
  useDarkModeMediaQuery: false,
  themeCssSelector: (theme) => {
    if (theme.type === "light") return '[data-color-scheme="light"]'
    if (theme.type === "dark") return '[data-color-scheme="dark"]'
    return false
  },
  plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
  defaultLocale: "en",
  styleOverrides: {
    codeFontFamily: "'JetBrains Mono', monospace",
    codeBackground: "var(--color-code-bg)",
    borderColor: "var(--color-border)",
  },
  defaultProps: {
    // Disable line numbers by default
    showLineNumbers: true,
    collapseStyle: "collapsible-auto",
    // But enable line numbers for certain languages
    overridesByLang: {
      "txt,bash,ascii,plain": {
        showLineNumbers: false,
      },
      bash: {
        frame: "terminal",
      },
    },
  },

  shiki: {
    langs: [import("./plugins/m3u8-grammar.js")],
    langAlias: {
      dns: "text",
    },
  },
})
