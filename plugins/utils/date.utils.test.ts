import path from "node:path"
import { describe, expect, it } from "vitest"
import { getPublishedDate } from "./date.utils"

describe("getPublishedDate", () => {
  const contentFolder = path.resolve("./content")

  const validCases: [string, string][] = [
    // Date in folder name
    [`${contentFolder}/posts/2023-08-10-some-text/some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10/some-text/some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/deep-dives/2023-08-10-some-text/some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/deep-dives/2023-08-10/some-text/some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10-deep-dives/some-text/some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10/deep-dives/some-text/some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10-deep-dives/some-text/some-file/index.md`, "2023-08-10"],

    // Date in filename
    [`${contentFolder}/posts/2023-08-10-some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/deep-dives/2023-08-10-some-file.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10-some-file/index.md`, "2023-08-10"],

    // Different years and months
    [`${contentFolder}/posts/2025-02-19-performance-testing-with-k6/index.md`, "2025-02-19"],
    [`${contentFolder}/posts/2023-03-01-js-pub-sub.md`, "2023-03-01"],
    [`${contentFolder}/posts/2024-12-31-year-end-post.md`, "2024-12-31"],

    // Edge cases
    [`${contentFolder}/posts/2023-08-10.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10/index.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10-some-slug.md`, "2023-08-10"],
    [`${contentFolder}/posts/2023-08-10-some-slug/index.md`, "2023-08-10"],
  ]

  validCases.forEach(([input, expectedDateString]) => {
    it(`${input} => ${expectedDateString}`, () => {
      const result = getPublishedDate(input)
      expect(result).toBeInstanceOf(Date)
      expect(result.toISOString().split("T")[0]).toBe(expectedDateString)
    })
  })

  describe("error cases", () => {
    it("should throw error for invalid date format in folder", () => {
      expect(() => {
        getPublishedDate(`${contentFolder}/posts/2023-13-45-invalid-date/some-file.md`)
      }).toThrow("Invalid date: 2023-13-45")
    })

    it("should throw error for invalid date format in filename", () => {
      expect(() => {
        getPublishedDate(`${contentFolder}/posts/some-folder/2023-13-45-invalid-date.md`)
      }).toThrow("Invalid date: 2023-13-45")
    })

    it("should throw error when no date found in path", () => {
      expect(() => {
        getPublishedDate(`${contentFolder}/posts/some-folder/some-file.md`)
      }).toThrow("Invalid date: Invalid date format in path")
    })

    it("should throw error for empty path", () => {
      expect(() => {
        getPublishedDate("")
      }).toThrow("File path is not within content folder")
    })

    it("should throw error for path without content folder", () => {
      expect(() => {
        getPublishedDate("/some/other/path/some-file.md")
      }).toThrow("File path is not within content folder")
    })
  })

  describe("date validation", () => {
    it("should handle leap year dates", () => {
      const result = getPublishedDate(`${contentFolder}/posts/2024-02-29-leap-year.md`)
      expect(result.toISOString().split("T")[0]).toBe("2024-02-29")
    })

    it("should reject invalid leap year dates", () => {
      expect(() => {
        getPublishedDate(`${contentFolder}/posts/2023-02-29-not-leap-year.md`)
      }).toThrow("Invalid date: 2023-02-29")
    })

    it("should handle month boundaries", () => {
      const result = getPublishedDate(`${contentFolder}/posts/2023-01-31-january.md`)
      expect(result.toISOString().split("T")[0]).toBe("2023-01-31")
    })

    it("should reject invalid month boundaries", () => {
      expect(() => {
        getPublishedDate(`${contentFolder}/posts/2023-02-30-invalid-february.md`)
      }).toThrow("Invalid date: 2023-02-30")
    })
  })
})
