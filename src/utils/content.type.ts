import { z } from "astro/zod"
import type { RenderResult } from "astro:content"

export interface Tag {
  id: string
  name: string
  href: string
}

export interface Series {
  id: string
  name: string
  blogs: PageContent[]
  featured: boolean
  href: string
}

export interface Subcategory {
  id: string
  name: string
  description: string
  deepDives: DeepDiveContent[]
  href: string
}

export interface Category {
  id: string
  name: string
  description: string
  featured: boolean
  subcategories: Subcategory[]
  href: string
  totalDeepDives: number
}

export interface DeepDiveContent {
  id: string
  pageSlug: string
  title: string
  minutesRead: string
  description: string
  publishedOn: Date
  lastUpdatedOn: Date
  isDraft: boolean
  tags: Tag[]
  Content: RenderResult["Content"]
  href: string
  type: "deep-dive"
  category: {
    id: string
    name: string
    href: string
  }
  subcategory: {
    id: string
    name: string
    href: string
  }
}

export interface PageContent {
  id: string
  pageSlug: string
  title: string
  minutesRead: string
  description: string
  publishedOn: Date
  lastUpdatedOn: Date
  isDraft: boolean
  featuredRank?: number
  tags: Tag[]
  Content: RenderResult["Content"]
  href: string
  type: "post" | "page"
}

export type PageContentItem = Omit<PageContent, "Content" | "tags">

export type DeepDiveContentItem = Omit<DeepDiveContent, "Content" | "tags">

// Generic content item that can be used for any content type
export type ContentItem = PageContentItem | DeepDiveContentItem

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
  pageSlug: z.string({ message: "Slug is required" }),
})
