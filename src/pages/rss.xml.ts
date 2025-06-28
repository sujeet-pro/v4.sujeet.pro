import { getBlogs } from "@/utils/content-blogs.utils";
import { getFilePath, getLinkProps } from "@/utils/link.utils";
import rss, { type RSSOptions } from "@astrojs/rss";
import type { APIRoute } from "astro";
import { site } from "astro:config/server";
export const GET: APIRoute = async () => {
  // Get all blog posts and pages, excluding drafts
  const blogs = await getBlogs();

  // Use Astro's site and base config for URLs
  const rssOptions: RSSOptions = {
    title: "Sujeet's Blog",
    description: "Personal blog and thoughts on technology, development, and life.",
    site: site + getLinkProps({ href: "/" }).href,
    stylesheet: getFilePath("rss", "styles.xsl"),
    items: blogs
      // .filter((blog) => !blog.isDraft)
      .map((item) => {
        const postUrl = getLinkProps({ href: `/blog/${item.id}` }).href;
        return {
          title: item.title,
          description: item.description,
          link: postUrl,
          pubDate: item.publishedOn,
          categories: item.tags.map((tag) => tag.name),
          customData: [`<lastmod>${new Date(item.lastUpdatedOn).toDateString()}</lastmod>`].join("\n"),
        };
      }),
    customData: [
      `<language>en</language>`,
      `<generator>Astro</generator>`,
      `<copyright>Copyright © ${new Date().getFullYear().toString()} Sujeet Jaiswal. All rights reserved.</copyright>`,
    ].join("\n"),
  };
  return rss(rssOptions);
};
