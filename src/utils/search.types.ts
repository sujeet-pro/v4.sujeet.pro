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
  tags: "string[]",
  tagNames: "string[]",
  href: "string",
  publishedOn: "number",
  minutesRead: "string",
} as const

/**
 * Document interface for Orama search index
 * Note: Uses empty strings instead of null for Orama compatibility
 */
export interface SearchDocument {
  id: string
  title: string
  description: string
  type: string // "writing" | "deep-dive" | "work" | "uses"
  category: string // empty string if not applicable
  categoryName: string // empty string if not applicable
  tags: string[]
  tagNames: string[]
  href: string
  publishedOn: number
  minutesRead: string
}

/**
 * URL search parameters
 */
export interface SearchParams {
  q: string
  sortBy: "relevance" | "date"
  categories: string[]
  tags: string[]
}

/**
 * Facet item with count
 */
export interface FacetItem {
  id: string
  name: string // Short name for display
  title?: string // Full descriptive title for categories
  count: number
}

/**
 * Facet options for filter UI with counts
 */
export interface SearchFacets {
  categories: FacetItem[]
  tags: FacetItem[]
}
