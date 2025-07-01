import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { defineEcConfig } from "astro-expressive-code";

export default defineEcConfig({
  themes: ["github-dark", "github-light"],
  plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
  defaultLocale: "en",
  removeUnusedThemes: false,
  themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
  useDarkModeMediaQuery: false,
  defaultProps: {
    // Disable line numbers by default
    showLineNumbers: false,
    collapseStyle: "collapsible-auto",
    // But enable line numbers for certain languages
    overridesByLang: {
      "js,ts,html": {
        showLineNumbers: true,
      },
      bash: {
        frame: "terminal",
      },
    },
  },

  shiki: {
    langs: [import("./plugins/m3u8-grammar.js")],
  },
});
