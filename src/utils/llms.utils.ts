/**
 * LLM-friendly content utilities
 * Generates llms.txt and llms-full.txt content for LLM consumption
 */

import { getCollection } from "astro:content"
import { getAllArticles, getAllBlogCards, getAllCategories, getAllProjectCards } from "./content"
import { getSiteOrigin } from "./site.utils"

interface ContentWithBody {
  id: string
  title: string
  description: string
  href: string
  contentType: "article" | "blog" | "project"
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

  // Get raw collections for body content
  const rawArticles = await getCollection("article")
  const rawBlogs = await getCollection("blog")
  const rawProjects = await getCollection("project")

  // Create lookup maps for raw content by ID
  const rawArticleBodyMap = new Map<string, string>()
  for (const item of rawArticles) {
    rawArticleBodyMap.set(item.id, item.body ?? "")
  }
  const rawBlogBodyMap = new Map<string, string>()
  for (const item of rawBlogs) {
    rawBlogBodyMap.set(item.id, item.body ?? "")
  }
  const rawProjectBodyMap = new Map<string, string>()
  for (const item of rawProjects) {
    rawProjectBodyMap.set(item.id, item.body ?? "")
  }

  // Articles
  const articleContent: ContentWithBody[] = articles.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    contentType: "article" as const,
    category: item.category,
    topic: item.topic,
    body: rawArticleBodyMap.get(item.id) ?? "",
  }))

  // Blogs
  const blogCards = await getAllBlogCards()
  const blogContent: ContentWithBody[] = blogCards.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    contentType: "blog" as const,
    category: { id: "", name: "" },
    topic: { id: "", name: "" },
    body: rawBlogBodyMap.get(item.id) ?? "",
  }))

  // Projects
  const projectCards = await getAllProjectCards()
  const projectContent: ContentWithBody[] = projectCards.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    href: item.href,
    contentType: "project" as const,
    category: { id: "", name: "" },
    topic: { id: "", name: "" },
    body: rawProjectBodyMap.get(item.id) ?? "",
  }))

  return [...articleContent, ...blogContent, ...projectContent]
}

/**
 * Generate llms.txt index content
 */
export async function generateLlmsTxt(): Promise<string> {
  const articles = await getAllArticles()
  const categories = await getAllCategories()
  const blogCards = await getAllBlogCards()
  const projectCards = await getAllProjectCards()
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
    "This site contains in-depth technical content organized by categories, blogs, and projects. For the complete content in a single file, see /llms-full.txt",
  )
  lines.push("")

  // Categories section (articles)
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

  // Blogs section
  if (blogCards.length > 0) {
    lines.push("## Blogs")
    lines.push("")
    for (const blog of blogCards) {
      lines.push(`- [${blog.title}](${siteOrigin}${blog.href}): ${blog.description}`)
    }
    lines.push("")
  }

  // Projects section
  if (projectCards.length > 0) {
    lines.push("## Projects")
    lines.push("")
    for (const project of projectCards) {
      lines.push(`- [${project.title}](${siteOrigin}${project.href}): ${project.description}`)
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

  const articleContent = allContent.filter((c) => c.contentType === "article")
  const blogContent = allContent.filter((c) => c.contentType === "blog")
  const projectContent = allContent.filter((c) => c.contentType === "project")

  const lines: string[] = []

  // Header
  lines.push("# Sujeet Jaiswal - Technical Blog (Full Content)")
  lines.push("")
  lines.push("> Complete technical blog content for LLM consumption.")
  lines.push("")
  lines.push(`Source: ${siteOrigin}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push(
    `Total content: ${allContent.length} (${articleContent.length} articles, ${blogContent.length} blogs, ${projectContent.length} projects)`,
  )
  lines.push("")
  lines.push("---")
  lines.push("")

  // Articles grouped by category
  for (const cat of categories) {
    const categoryContent = articleContent.filter((c) => c.category.id === cat.id)
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

  // Blogs section
  if (blogContent.length > 0) {
    lines.push("# BLOGS")
    lines.push("")

    for (const item of blogContent) {
      lines.push("---")
      lines.push("")
      lines.push(`## ${item.title}`)
      lines.push("")
      lines.push(`**URL:** ${siteOrigin}${item.href}`)
      lines.push(`**Description:** ${item.description}`)
      lines.push("")
      lines.push(item.body)
      lines.push("")
    }
  }

  // Projects section
  if (projectContent.length > 0) {
    lines.push("# PROJECTS")
    lines.push("")

    for (const item of projectContent) {
      lines.push("---")
      lines.push("")
      lines.push(`## ${item.title}`)
      lines.push("")
      lines.push(`**URL:** ${siteOrigin}${item.href}`)
      lines.push(`**Description:** ${item.description}`)
      lines.push("")
      lines.push(item.body)
      lines.push("")
    }
  }

  return lines.join("\n")
}
