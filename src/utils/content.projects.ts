/**
 * Project content processing utilities
 *
 * Processes the project collection, orders by ordering.json5,
 * and supports pinning.
 */

import { getCollection, render } from "astro:content"
import { parseFrontmatter } from "./content.helpers"
import { filterDrafts, getOrdering, sortByOrdering } from "./content.core"
import type { ProjectCardInfo, ProjectItem, ProjectItemWithoutContent } from "./content.types"

// =============================================================================
// Internal Processing
// =============================================================================

let cachedProjects: ProjectItem[] | null = null

async function processAllProjects(): Promise<ProjectItem[]> {
  if (cachedProjects) return cachedProjects

  const projectItems = await getCollection("project")
  const projects: ProjectItem[] = []

  for (const item of projectItems) {
    const { Content, remarkPluginFrontmatter } = await render(item)
    const frontmatter = parseFrontmatter(remarkPluginFrontmatter, item.id)

    projects.push({
      id: item.id,
      title: frontmatter.title,
      description: frontmatter.description,
      minutesRead: frontmatter.minutesRead,
      isDraft: frontmatter.isDraft,
      gitRepo: item.data.gitRepo,
      demoUrl: item.data.demoUrl,
      tags: item.data.tags ?? [],
      href: `/projects/${item.id}`,
      Content,
    })
  }

  // Sort by ordering.json5 projects array
  const ordering = await getOrdering()
  const sorted = sortByOrdering(projects, ordering.projects, (p) => p.id)

  cachedProjects = sorted
  return cachedProjects
}

function stripContent(project: ProjectItem): ProjectItemWithoutContent {
  const { Content: _, ...rest } = project
  return rest
}

function toProjectCard(project: ProjectItemWithoutContent): ProjectCardInfo {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    href: project.href,
    minutesRead: project.minutesRead,
    gitRepo: project.gitRepo,
    demoUrl: project.demoUrl,
    tags: project.tags,
    isDraft: project.isDraft,
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Get all project cards, filtered for drafts, with pinned items first.
 */
export async function getAllProjectCards(): Promise<ProjectCardInfo[]> {
  const allProjects = await processAllProjects()
  const ordering = await getOrdering()
  const pinnedSlugs = new Set(ordering.pinnedProjects)

  const filtered = filterDrafts(allProjects)
  const cards = filtered.map(stripContent).map(toProjectCard)

  // Move pinned items to front
  const pinned = cards.filter((c) => pinnedSlugs.has(c.id))
  const unpinned = cards.filter((c) => !pinnedSlugs.has(c.id))
  return [...pinned, ...unpinned]
}

/**
 * Get a single project page with full content.
 */
export async function getProjectPage(slug: string): Promise<ProjectItem | null> {
  const allProjects = await processAllProjects()
  return allProjects.find((p) => p.id === slug) ?? null
}

/**
 * Get all project paths for static generation.
 */
export async function getAllProjectPaths(): Promise<string[]> {
  const allProjects = await processAllProjects()
  return allProjects.map((p) => p.id)
}
