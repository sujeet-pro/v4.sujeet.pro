import js from "@eslint/js"
import json from "@eslint/json"
import markdown from "@eslint/markdown"
import astro from "eslint-plugin-astro"
import { defineConfig, globalIgnores } from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"

// Base language options for JavaScript/TypeScript files
const baseLanguageOptions = {
  sourceType: "module",
  globals: {
    ...globals.browser,
    ...globals.node,
  },
}

// JavaScript/TypeScript/Astro configurations
const jsTsAstroConfigs = defineConfig([
  // JavaScript configuration
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs", "**/*.astro/*.js", "*.astro/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ...baseLanguageOptions,
      parser: js.parser,
    },
  },
  // TypeScript configuration
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts", "**/*.astro/*.ts", "*.astro/*.ts"],
    languageOptions: {
      ...baseLanguageOptions,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // TypeScript strict and stylistic rules
  ...[...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked].map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts", "**/*.astro/*.ts", "*.astro/*.ts"],
  })),
  // Astro configuration
  ...astro.configs["flat/jsx-a11y-strict"].map((config) => ({
    files: ["**/*.astro", "*.astro", "**/*.astro/*.js", "*.astro/*.js", "**/*.astro/*.ts", "*.astro/*.ts"],
    ...config,
  })),
])

// JSON configurations
const jsonConfigs = defineConfig([
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
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/jsonc",
    languageOptions: {
      allowTrailingCommas: true,
    },
    extends: ["json/recommended"],
  },
])

// Markdown configuration
const markdownConfig = defineConfig([
  {
    files: ["**/*.md"],
    plugins: { markdown },
    languageOptions: {
      frontmatter: "yaml",
    },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
])

// Main configuration
const config = defineConfig([
  globalIgnores([".astro", ".vscode", "node_modules", "dist", "public"]),
  // ...jsTsAstroConfigs,
  // ...jsonConfigs,
  // ...markdownConfig,
])

export default config
