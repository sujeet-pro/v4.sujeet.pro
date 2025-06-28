import { z } from "astro/zod";
import type { RenderResult } from "astro:content";

export interface Tag {
  id: string;
  name: string;
  href: string;
}

export interface Series {
  id: string;
  name: string;
  blogs: PageContent[];
  href: string;
}

export interface PageContent {
  id: string;
  title: string;
  minutesRead: string;
  description: string;
  publishedOn: Date;
  lastUpdatedOn: Date;
  isDraft: boolean;
  tags: Tag[];
  Content: RenderResult["Content"];
  href: string;
  type: "blog" | "page";
}

export const remarkPluginFrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required, check plugin for auto-generation. Ensure content has level 1 heading"),
  minutesRead: z.string().min(1, "Minutes read is required"),
});
