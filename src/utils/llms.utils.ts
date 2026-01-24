/**
 * LLM-friendly content utilities
 * Generates llms.txt and llms-full.txt content for LLM consumption
 */

import { getCollection } from "astro:content"
import { getAllArticles, getAllCategories } from "./content"
import { getSiteOrigin } from "./site.utils"

interface ContentWithBody {
  id: string
  title: string
  description: string
  href: string
  category: { id: string; name: string }
  topic: { id: string; name: string }
  body: string
}

/**
 * Get all content with raw markdown bodies
 */
export async function getAllContentWithBodies(): Promise<ContentWithBody[]> {
  // Get processed content for metadata
  const articles = await getAllArticles()

  // Get raw collection for body content
  const rawArticles = await getCollection("article")

  // Create lookup maps for raw content by ID
  const rawBodyMap = new Map<string, string>()
  for (const item of rawArticles) {
    rawBodyMap.set(item.id, item.body ?? "")
  }

  // Combine processed metadata with raw bodies
  const allContent: ContentWithBody[] = articles.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    category: item.category,
    topic: item.topic,
    body: rawBodyMap.get(item.id) ?? "",
  }))

  return allContent
}

/**
 * Generate llms.txt index content
 */
export async function generateLlmsTxt(): Promise<string> {
  const articles = await getAllArticles()
  const categories = await getAllCategories()
  const siteOrigin = await getSiteOrigin()

  const lines: string[] = []

  // Header
  lines.push("# Sujeet Jaiswal - Technical Blog")
  lines.push("")
  lines.push(
    "> Personal technical blog covering web development, system design, and performance optimization. Written by a Frontend Principal Engineer with expertise in building scalable web applications.",
  )
  lines.push("")
  lines.push(
    "This site contains in-depth technical content organized by categories. For the complete content in a single file, see /llms-full.txt",
  )
  lines.push("")

  // Categories section
  lines.push("## Categories")
  lines.push("")
  for (const cat of categories) {
    const categoryArticles = articles.filter((p) => p.category.id === cat.id)
    if (categoryArticles.length === 0) continue

    lines.push(`### ${cat.name}`)
    lines.push("")
    lines.push(cat.description)
    lines.push("")
    for (const item of categoryArticles) {
      const topicLabel = ` [${item.topic.name}]`
      lines.push(`- [${item.title}](${siteOrigin}${item.href}):${topicLabel} ${item.description}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

/**
 * Generate llms-full.txt with all content
 */
export async function generateLlmsFullTxt(): Promise<string> {
  const allContent = await getAllContentWithBodies()
  const categories = await getAllCategories()
  const siteOrigin = await getSiteOrigin()

  const lines: string[] = []

  // Header
  lines.push("# Sujeet Jaiswal - Technical Blog (Full Content)")
  lines.push("")
  lines.push("> Complete technical blog content for LLM consumption.")
  lines.push("")
  lines.push(`Source: ${siteOrigin}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(`Total articles: ${allContent.length}`)
  lines.push("")
  lines.push("---")
  lines.push("")

  // Group content by category
  for (const cat of categories) {
    const categoryContent = allContent.filter((c) => c.category.id === cat.id)
    if (categoryContent.length === 0) continue

    lines.push(`# ${cat.name.toUpperCase()}`)
    lines.push("")
    lines.push(cat.description)
    lines.push("")

    for (const item of categoryContent) {
      lines.push("---")
      lines.push("")
      lines.push(`## ${item.title}`)
      lines.push("")
      lines.push(`**URL:** ${siteOrigin}${item.href}`)
      lines.push(`**Category:** ${item.category.name} / ${item.topic.name}`)
      lines.push(`**Description:** ${item.description}`)
      lines.push("")
      lines.push(item.body)
      lines.push("")
    }
  }

  return lines.join("\n")
}
