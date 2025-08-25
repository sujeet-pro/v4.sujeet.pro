#!/usr/bin/env node

import { readFileSync } from "fs"
import { join } from "path"

/**
 *
 * Script to validate all sujeet.pro domain links in a markdown file
 * Usage: npx tsx scripts/validate-links.ts <markdown-file-path>
 */

interface LinkCheckResult {
  url: string
  status: number | null
  error?: string
}

async function checkLink(url: string): Promise<LinkCheckResult> {
  try {
    const response = await fetch(url, {
      method: "HEAD", // Use HEAD to avoid downloading content
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    return {
      url,
      status: response.status,
    }
  } catch (error) {
    return {
      url,
      status: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function extractSujeetProLinks(content: string): string[] {
  // Regex to match sujeet.pro links in markdown format and plain URLs
  const linkRegex = /(?:\[.*?\]\()?https?:\/\/(?:www\.)?sujeet\.pro[^\s\)]+/g
  const matches = content.match(linkRegex) || []

  // Clean up the links (remove markdown syntax)
  const cleanLinks = matches.map((link) => {
    // Remove markdown link syntax if present
    const urlMatch = link.match(/https?:\/\/(?:www\.)?sujeet\.pro[^\s\)]+/)
    return urlMatch ? urlMatch[0] : link
  })

  // Remove duplicates
  return [...new Set(cleanLinks)]
}

async function validateLinksInFile(filePath: string): Promise<void> {
  try {
    console.log(`🔍 Checking links in: ${filePath}\n`)

    // Read the markdown file
    const content = readFileSync(filePath, "utf-8")

    // Extract all sujeet.pro links
    const links = extractSujeetProLinks(content)

    if (links.length === 0) {
      console.log("No sujeet.pro links found in the file.")
      return
    }

    console.log(`Found ${links.length} sujeet.pro links:`)
    links.forEach((link, index) => {
      console.log(`${index + 1}. ${link}`)
    })
    console.log("\n📡 Checking link validity...\n")

    // Check each link
    const results: LinkCheckResult[] = []

    for (const link of links) {
      process.stdout.write(`Checking: ${link}... `)
      const result = await checkLink(link)
      results.push(result)

      if (result.status === 200) {
        console.log("✅ OK")
      } else if (result.status && result.status >= 300 && result.status < 400) {
        console.log(`🔄 Redirect (${result.status})`)
      } else {
        console.log(`❌ Failed (${result.status || "Error"})`)
      }
    }

    // Summary
    console.log("\n📊 Results Summary:")
    console.log("==================")

    const validLinks = results.filter((r) => r.status === 200)
    const redirectLinks = results.filter((r) => r.status && r.status >= 300 && r.status < 400)
    const brokenLinks = results.filter((r) => !r.status || r.status >= 400)

    console.log(`✅ Valid links: ${validLinks.length}`)
    console.log(`🔄 Redirects: ${redirectLinks.length}`)
    console.log(`❌ Broken links: ${brokenLinks.length}`)

    if (redirectLinks.length > 0) {
      console.log("\n🔄 Redirect Links:")
      redirectLinks.forEach((link) => {
        console.log(`  - ${link.url} (Status: ${link.status})`)
      })
    }

    if (brokenLinks.length > 0) {
      console.log("\n❌ Broken Links:")
      brokenLinks.forEach((link) => {
        console.log(`  - ${link.url} (Status: ${link.status || "Error"}) ${link.error ? `- ${link.error}` : ""}`)
      })

      process.exit(1) // Exit with error code if broken links found
    } else {
      console.log("\n🎉 All links are valid!")
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : "Unknown error")
    process.exit(1)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error("Usage: npx tsx scripts/validate-links.ts <markdown-file-path>")
    console.error("Example: npx tsx scripts/validate-links.ts content/raw/resume.md")
    process.exit(1)
  }

  const filePath = args[0]

  // Convert relative path to absolute if needed
  const absolutePath = filePath.startsWith("/") ? filePath : join(process.cwd(), filePath)

  await validateLinksInFile(absolutePath)
}

// Run if this file is executed directly
main().catch(console.error)

export { checkLink, extractSujeetProLinks, validateLinksInFile }
