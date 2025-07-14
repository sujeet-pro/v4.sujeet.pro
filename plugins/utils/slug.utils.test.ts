import path from "node:path"
import { describe, expect, it } from "vitest"
import { getSlug } from "./slug.utils"

describe("getSlug", () => {
  const contentFolder = path.resolve("./content")

  const cases: [string, string][] = [
    // Folder structure maintained until date is discovered
    [`${contentFolder}/posts/deep-dives/2023-08-10-some-text/some-file.md`, "deep-dives/some-text-some-file"],
    [`${contentFolder}/posts/deep-dives/2023-08-10/some-text/some-file.md`, "deep-dives/some-text-some-file"],
    [`${contentFolder}/posts/deep-dives/2023-08-10-some-text/some-file/index.md`, "deep-dives/some-text-some-file"],

    // Date at root level - flatten structure
    [`${contentFolder}/posts/2023-08-10-deep-dives/some-text/some-file.md`, "deep-dives-some-text-some-file"],
    [`${contentFolder}/posts/2023-08-10/deep-dives/some-text/some-file.md`, "deep-dives-some-text-some-file"],
    [`${contentFolder}/posts/2023-08-10-deep-dives/some-text/some-file/index.md`, "deep-dives-some-text-some-file"],

    // Other cases
    [`${contentFolder}/posts/2025-02-19-performance-testing-with-k6/index.md`, "performance-testing-with-k6"],
    [`${contentFolder}/posts/deep-dives/2023-08-10-critical-rendering-path.md`, "deep-dives/critical-rendering-path"],
    [`${contentFolder}/posts/programming/2023-03-01-js-pub-sub.md`, "programming/js-pub-sub"],
    [`${contentFolder}/posts/2023-08-10/index.md`, ""],
    [`${contentFolder}/posts/2023-08-10.md`, ""],
    [`${contentFolder}/posts/2023-08-10-some-slug.md`, "some-slug"],
    [`${contentFolder}/posts/2023-08-10-some-slug/index.md`, "some-slug"],
    [`${contentFolder}/posts/2023-08-10-some-slug/another-folder/file.md`, "some-slug-another-folder-file"],
    [`${contentFolder}/posts/system-design-fundamentals/2025-04-01-caching.md`, "system-design-fundamentals/caching"],
  ]

  cases.forEach(([input, expected]) => {
    it(`${input} => ${expected}`, () => {
      expect(getSlug(input)).toBe(expected)
    })
  })

  describe("error cases", () => {
    it("should throw error for file outside content folder", () => {
      expect(() => {
        getSlug("/some/other/path/file.md")
      }).toThrow("File path is not within content folder")
    })
  })
})
