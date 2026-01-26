import * as fs from "node:fs"
import * as path from "node:path"

export const CONTENT_DIR = path.join(process.cwd(), "content/articles")

export interface ContentStructure {
  categories: string[]
  topics: Map<string, string[]>
  articles: Map<string, string[]>
  allArticlePaths: string[]
  allArticleSlugs: string[]
  allTopicIds: string[]
}

export function discoverContent(): ContentStructure {
  const categories: string[] = []
  const topics = new Map<string, string[]>()
  const articles = new Map<string, string[]>()
  const allArticlePaths: string[] = []
  const allArticleSlugs: string[] = []
  const allTopicIds: string[] = []

  const categoryDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))

  for (const categoryDir of categoryDirs) {
    const categoryId = categoryDir.name
    const categoryPath = path.join(CONTENT_DIR, categoryId)

    if (fs.existsSync(path.join(categoryPath, "README.md"))) {
      categories.push(categoryId)
    }

    const topicDirs = fs
      .readdirSync(categoryPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))

    const categoryTopics: string[] = []
    for (const topicDir of topicDirs) {
      const topicId = topicDir.name
      const topicPath = path.join(categoryPath, topicId)

      if (fs.existsSync(path.join(topicPath, "README.md"))) {
        categoryTopics.push(topicId)
        allTopicIds.push(topicId)
      }

      const articleDirs = fs
        .readdirSync(topicPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))

      const topicArticles: string[] = []
      for (const articleDir of articleDirs) {
        const articleSlug = articleDir.name
        const articlePath = path.join(topicPath, articleSlug)

        if (fs.existsSync(path.join(articlePath, "README.md"))) {
          topicArticles.push(articleSlug)
          allArticlePaths.push(`${categoryId}/${topicId}/${articleSlug}`)
          allArticleSlugs.push(articleSlug)
        }
      }

      if (topicArticles.length > 0) {
        articles.set(topicId, topicArticles)
      }
    }

    if (categoryTopics.length > 0) {
      topics.set(categoryId, categoryTopics)
    }
  }

  return { categories, topics, articles, allArticlePaths, allArticleSlugs, allTopicIds }
}
