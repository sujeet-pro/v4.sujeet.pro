/**
 * Orama schema definition for search index
 * Used by both build-time indexing and client-side search
 * @see https://docs.orama.com/open-source/usage/create
 */
export const SEARCH_SCHEMA = {
  id: "string",
  title: "string",
  description: "string",
  type: "string",
  category: "string",
  categoryName: "string",
  topic: "string",
  topicName: "string",
  href: "string",
  minutesRead: "string",
} as const

/**
 * Document interface for Orama search index
 */
export interface SearchDocument {
  id: string
  title: string
  description: string
  type: string // "article"
  category: string
  categoryName: string
  topic: string
  topicName: string
  href: string
  minutesRead: string
}

/**
 * URL search parameters
 */
export interface SearchParams {
  q: string
  categories: string[]
  topics: string[]
}

/**
 * Facet item with count
 */
export interface FacetItem {
  id: string
  name: string // Short name for display
  title?: string // Full descriptive title
  count: number
  categoryId?: string // For topics, the parent category
}

/**
 * Facet options for filter UI with counts
 */
export interface SearchFacets {
  categories: FacetItem[]
  topics: FacetItem[]
}
