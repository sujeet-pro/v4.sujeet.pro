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
  subcategory: "string",
  categoryName: "string",
  subcategoryName: "string",
  tags: "string[]",
  tagNames: "string[]",
  href: "string",
  publishedOn: "number",
  minutesRead: "string",
  seriesId: "string",
  seriesName: "string",
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
  subcategory: string // empty string if not applicable
  categoryName: string // empty string if not applicable
  subcategoryName: string // empty string if not applicable
  tags: string[]
  tagNames: string[]
  href: string
  publishedOn: number
  minutesRead: string
  seriesId: string // empty string if not applicable
  seriesName: string // empty string if not applicable
}

/**
 * URL search parameters
 */
export interface SearchParams {
  q: string
  sortBy: "relevance" | "date"
  categories: string[]
  subcategories: string[]
  tags: string[]
}

/**
 * Facet item with count
 */
export interface FacetItem {
  id: string
  name: string
  count: number
}

/**
 * Subcategory facet item with parent category
 */
export interface SubcategoryFacetItem extends FacetItem {
  categoryId: string
}

/**
 * Facet options for filter UI with counts
 */
export interface SearchFacets {
  categories: FacetItem[]
  subcategories: SubcategoryFacetItem[]
  tags: FacetItem[]
}
