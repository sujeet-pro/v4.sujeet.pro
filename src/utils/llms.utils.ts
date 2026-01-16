/**
 * LLM-friendly content utilities
 * Generates llms.txt and llms-full.txt content for LLM consumption
 */

import { getCollection } from "astro:content"
import { getDeepDives, getUses, getWork, getWriting } from "./content-collection.utils"
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
  const [writing, deepDives, work, uses] = await Promise.all([
    getWriting(),
    getDeepDives(),
    getWork(),
    getUses(),
  ])

  // Get raw collections for body content
  const [rawWriting, rawDeepDives, rawWork, rawUses] = await Promise.all([
    getCollection("writing"),
    getCollection("deep-dives"),
    getCollection("work"),
    getCollection("uses"),
  ])

  // Create lookup maps for raw content by ID
  const rawBodyMap = new Map<string, string>()
  for (const item of [...rawWriting, ...rawDeepDives, ...rawWork, ...rawUses]) {
    rawBodyMap.set(item.id, item.body ?? "")
  }

  // Combine processed metadata with raw bodies
  const allContent: ContentWithBody[] = []

  for (const item of writing) {
    allContent.push({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      type: "writing",
      category: item.category,
      body: rawBodyMap.get(item.id) ?? "",
      publishedOn: item.publishedOn,
    })
  }

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

  for (const item of work) {
    allContent.push({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      type: "work",
      category: item.category,
      body: rawBodyMap.get(item.id) ?? "",
      publishedOn: item.publishedOn,
    })
  }

  for (const item of uses) {
    allContent.push({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      type: "uses",
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
  const [writing, deepDives, work, uses] = await Promise.all([
    getWriting(),
    getDeepDives(),
    getWork(),
    getUses(),
  ])

  const lines: string[] = []

  // Header
  lines.push("# Sujeet Jaiswal - Technical Blog")
  lines.push("")
  lines.push("> Personal technical blog covering web development, system design, performance optimization, and engineering leadership. Written by a Frontend Principal Engineer with expertise in building scalable web applications.")
  lines.push("")
  lines.push("This site contains technical articles, deep dives, and work documentation. For the complete content in a single file, see /llms-full.txt")
  lines.push("")

  // Deep Dives section
  lines.push("## Deep Dives")
  lines.push("")
  lines.push("In-depth technical explorations of specific topics.")
  lines.push("")
  for (const item of deepDives) {
    const categoryLabel = item.category ? ` [${item.category.name}]` : ""
    lines.push(`- [${item.title}](${SITE.origin}${item.href}):${categoryLabel} ${item.description}`)
  }
  lines.push("")

  // Work section
  lines.push("## Work")
  lines.push("")
  lines.push("Design documents, architecture decisions, and adoption stories from real projects.")
  lines.push("")
  for (const item of work) {
    const categoryLabel = item.category ? ` [${item.category.name}]` : ""
    lines.push(`- [${item.title}](${SITE.origin}${item.href}):${categoryLabel} ${item.description}`)
  }
  lines.push("")

  // Writing section
  lines.push("## Writing")
  lines.push("")
  lines.push("Technical articles and tutorials on programming patterns and concepts.")
  lines.push("")
  for (const item of writing) {
    const categoryLabel = item.category ? ` [${item.category.name}]` : ""
    lines.push(`- [${item.title}](${SITE.origin}${item.href}):${categoryLabel} ${item.description}`)
  }
  lines.push("")

  // Optional section
  lines.push("## Optional")
  lines.push("")
  lines.push("Additional resources that may be helpful but are not essential.")
  lines.push("")
  for (const item of uses) {
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
  lines.push("> Complete technical blog content for LLM consumption. Contains all articles, deep dives, and documentation.")
  lines.push("")
  lines.push(`Source: ${SITE.origin}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Total articles: ${allContent.length}`)
  lines.push("")
  lines.push("---")
  lines.push("")

  // Group content by type
  const deepDives = allContent.filter((c) => c.type === "deep-dive")
  const work = allContent.filter((c) => c.type === "work")
  const writing = allContent.filter((c) => c.type === "writing")
  const uses = allContent.filter((c) => c.type === "uses")

  // Deep Dives
  if (deepDives.length > 0) {
    lines.push("# DEEP DIVES")
    lines.push("")
    lines.push("In-depth technical explorations of specific topics.")
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

  // Work
  if (work.length > 0) {
    lines.push("---")
    lines.push("")
    lines.push("# WORK")
    lines.push("")
    lines.push("Design documents, architecture decisions, and adoption stories.")
    lines.push("")
    for (const item of work) {
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

  // Writing
  if (writing.length > 0) {
    lines.push("---")
    lines.push("")
    lines.push("# WRITING")
    lines.push("")
    lines.push("Technical articles and tutorials.")
    lines.push("")
    for (const item of writing) {
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

  // Uses (optional)
  if (uses.length > 0) {
    lines.push("---")
    lines.push("")
    lines.push("# USES (Optional)")
    lines.push("")
    lines.push("Tools, setup guides, and productivity tips.")
    lines.push("")
    for (const item of uses) {
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
