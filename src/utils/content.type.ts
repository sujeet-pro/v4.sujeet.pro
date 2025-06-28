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
  title: z
    .string({
      required_error: "Title is required",
      message: "Title is required",
    })
    .min(1, "Title is required of min size 1"),
  description: z.string({ message: "Description is required" }).min(1, "Description is required"),
  minutesRead: z.string({ message: "Minutes read is required" }).min(1, "Minutes read is required"),
  publishedOn: z.coerce.date({ message: "Published on is required" }),
  isDraft: z.boolean({ message: "Is draft is required" }),
});
