import css from "@eslint/css";
import { tailwindSyntax } from "@eslint/css/syntax";

import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["node_modules", "dist", "build", "public", "public/**", "dist/**", "build/**"]),
  {
    ...js.configs.recommended,
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs", "**/*.astro/*.js", "*.astro/*.js"],
    languageOptions: {
      parser: js.parser,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts", "**/*.astro/*.ts", "*.astro/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      sourceType: "module",
      parser: tseslint.parser,
    },
  },
  [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked].map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts", "**/*.astro/*.ts", "*.astro/*.ts"],
  })),

  astro.configs["flat/jsx-a11y-strict"].map((config) => ({
    files: ["**/*.astro", "*.astro", "**/*.astro/*.js", "*.astro/*.js", "**/*.astro/*.ts", "*.astro/*.ts"],
    // If the file is not configured, apply for all the astro files.
    ...config,
  })),

  // JSON files
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json", "**/tsconfig.json", ".vscode/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/tsconfig.json", ".vscode/*.json"],
    plugins: { json },
    language: "json/jsonc",
    languageOptions: {
      allowTrailingCommas: true,
    },
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },

  // CSS files
  {
    files: ["**/*.css"],
    plugins: {
      css,
    },
    language: "css/css",
    languageOptions: {
      customSyntax: tailwindSyntax,
    },
    extends: ["css/recommended"],
  },

  // Markdown files
  {
    files: ["**/*.md"],
    plugins: { markdown },
    languageOptions: {
      frontmatter: "yaml",
    },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
]);
