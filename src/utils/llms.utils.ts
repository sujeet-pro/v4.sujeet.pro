/**
 * LLM-friendly content utilities
 * Generates llms.txt and llms-full.txt content for LLM consumption
 */

import { getCollection } from "astro:content"
import { getDeepDives, getNotes } from "./content-collection.utils"
import { SITE } from "@/constants/site"

interface ContentWithBody {
  id: string
  title: string
  description: string
  href: string
  type: string
  category?: { id: string; name: string }
  body: string
  publishedOn: Date
}

/**
 * Get all content with raw markdown bodies
 */
export async function getAllContentWithBodies(): Promise<ContentWithBody[]> {
  // Get processed content for metadata
  const [deepDives, notes] = await Promise.all([getDeepDives(), getNotes()])

  // Get raw collections for body content
  const [rawDeepDives, rawNotes] = await Promise.all([getCollection("deep-dives"), getCollection("notes")])

  // Create lookup maps for raw content by ID
  const rawBodyMap = new Map<string, string>()
  for (const item of [...rawDeepDives, ...rawNotes]) {
    rawBodyMap.set(item.id, item.body ?? "")
  }

  // Combine processed metadata with raw bodies
  const allContent: ContentWithBody[] = []

  for (const item of deepDives) {
    allContent.push({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      type: "deep-dive",
      category: item.category,
      body: rawBodyMap.get(item.id) ?? "",
      publishedOn: item.publishedOn,
    })
  }

  for (const item of notes) {
    allContent.push({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      type: "notes",
      category: item.category,
      body: rawBodyMap.get(item.id) ?? "",
      publishedOn: item.publishedOn,
    })
  }

  // Sort by date descending
  allContent.sort((a, b) => b.publishedOn.getTime() - a.publishedOn.getTime())

  return allContent
}

/**
 * Generate llms.txt index content
 */
export async function generateLlmsTxt(): Promise<string> {
  const [deepDives, notes] = await Promise.all([getDeepDives(), getNotes()])

  const lines: string[] = []

  // Header
  lines.push("# Sujeet Jaiswal - Technical Blog")
  lines.push("")
  lines.push("> Personal technical blog covering web development, system design, performance optimization, and engineering leadership. Written by a Frontend Principal Engineer with expertise in building scalable web applications.")
  lines.push("")
  lines.push("This site contains in-depth technical content and casual technical notes. For the complete content in a single file, see /llms-full.txt")
  lines.push("")

  // Deep Dives section
  lines.push("## Deep Dives")
  lines.push("")
  lines.push("In-depth technical explorations and comprehensive guides.")
  lines.push("")
  for (const item of deepDives) {
    const categoryLabel = item.category ? ` [${item.category.name}]` : ""
    lines.push(`- [${item.title}](${SITE.origin}${item.href}):${categoryLabel} ${item.description}`)
  }
  lines.push("")

  // Notes section
  lines.push("## Notes")
  lines.push("")
  lines.push("Casual technical content - design docs, programming patterns, tools, and productivity.")
  lines.push("")
  for (const item of notes) {
    const categoryLabel = item.category ? ` [${item.category.name}]` : ""
    lines.push(`- [${item.title}](${SITE.origin}${item.href}):${categoryLabel} ${item.description}`)
  }

  return lines.join("\n")
}

/**
 * Generate llms-full.txt with all content
 */
export async function generateLlmsFullTxt(): Promise<string> {
  const allContent = await getAllContentWithBodies()

  const lines: string[] = []

  // Header
  lines.push("# Sujeet Jaiswal - Technical Blog (Full Content)")
  lines.push("")
  lines.push("> Complete technical blog content for LLM consumption. Contains all deep dives and notes.")
  lines.push("")
  lines.push(`Source: ${SITE.origin}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Total articles: ${allContent.length}`)
  lines.push("")
  lines.push("---")
  lines.push("")

  // Group content by type
  const deepDives = allContent.filter((c) => c.type === "deep-dive")
  const notes = allContent.filter((c) => c.type === "notes")

  // Deep Dives
  if (deepDives.length > 0) {
    lines.push("# DEEP DIVES")
    lines.push("")
    lines.push("In-depth technical explorations and comprehensive guides.")
    lines.push("")
    for (const item of deepDives) {
      lines.push("---")
      lines.push("")
      lines.push(`## ${item.title}`)
      lines.push("")
      lines.push(`**URL:** ${SITE.origin}${item.href}`)
      if (item.category) {
        lines.push(`**Category:** ${item.category.name}`)
      }
      lines.push(`**Description:** ${item.description}`)
      lines.push("")
      lines.push(item.body)
      lines.push("")
    }
  }

  // Notes
  if (notes.length > 0) {
    lines.push("---")
    lines.push("")
    lines.push("# NOTES")
    lines.push("")
    lines.push("Casual technical content - design docs, programming patterns, tools, and productivity.")
    lines.push("")
    for (const item of notes) {
      lines.push("---")
      lines.push("")
      lines.push(`## ${item.title}`)
      lines.push("")
      lines.push(`**URL:** ${SITE.origin}${item.href}`)
      if (item.category) {
        lines.push(`**Category:** ${item.category.name}`)
      }
      lines.push(`**Description:** ${item.description}`)
      lines.push("")
      lines.push(item.body)
      lines.push("")
    }
  }

  return lines.join("\n")
}
