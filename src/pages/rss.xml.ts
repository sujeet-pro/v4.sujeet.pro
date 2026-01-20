import { getAllContentChronological } from "@/utils/content-filters.utils"
import { getFilePath, getLinkProps } from "@/utils/link.utils"
import rss, { type RSSOptions } from "@astrojs/rss"
import type { APIRoute } from "astro"
import { site } from "astro:config/server"
export const GET: APIRoute = async () => {
  // Get all content from all types, sorted chronologically (newest first)
  const allContent = await getAllContentChronological()

  // Use Astro's site and base config for URLs
  const rssOptions: RSSOptions = {
    title: "Sujeet's Blog",
    description: "Technical blog covering web development, system design, and performance optimization.",
    site: site + getLinkProps({ href: "/" }).href,
    stylesheet: getFilePath("rss", "styles.xsl"),
    items: allContent.map((item) => {
      const postUrl = getLinkProps({ href: item.href }).href
      const lastModDate = item.lastUpdatedOn ?? item.publishedOn
      return {
        title: item.title,
        description: item.description,
        link: postUrl,
        pubDate: item.publishedOn,
        categories: item.tags.map((tag) => tag.name),
        customData: [`<lastmod>${lastModDate.toDateString()}</lastmod>`].join("\n"),
      }
    }),
    customData: [
      `<language>en</language>`,
      `<generator>Astro</generator>`,
      `<copyright>Copyright © ${new Date().getFullYear().toString()} Sujeet Jaiswal. All rights reserved.</copyright>`,
    ].join("\n"),
  }
  return rss(rssOptions)
}
