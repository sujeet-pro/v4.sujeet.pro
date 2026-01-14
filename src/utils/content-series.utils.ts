/**
 * Series content utilities
 * Handles content series - ordered groups of related articles
 */

import { getCollection } from "astro:content"
import type { ContentItemWithoutContent, Series } from "./content.type"
import { getAllContentItems } from "./content.utils"

/**
 * Get all series with resolved content items
 */
export async function getAllSeries(): Promise<Series[]> {
  const seriesConfig = await getCollection("series")
  const allContent = await getAllContentItems()

  const contentMap = new Map(allContent.map((c) => [c.id, c]))

  return seriesConfig.map((s) => {
    const items = s.data.items
      .map((itemId: string) => contentMap.get(itemId))
      .filter((item): item is ContentItemWithoutContent => item !== undefined)

    return {
      id: s.id,
      name: s.data.name,
      items,
      featured: s.data.featured,
      // First item's href is the series link
      href: items[0]?.href ?? "#",
    }
  })
}

/**
 * Get featured series
 */
export async function getFeaturedSeries(): Promise<Series[]> {
  const allSeries = await getAllSeries()
  return allSeries.filter((series) => series.featured)
}

/**
 * Get series that contains a specific content item
 */
export async function getSeriesForItem(itemId: string): Promise<Series | null> {
  const allSeries = await getAllSeries()
  return allSeries.find((s) => s.items.some((i) => i.id === itemId)) ?? null
}

/**
 * Get prev/next items within a series
 */
export async function getSeriesNavigation(itemId: string): Promise<{
  series: Series | null
  prevInSeries: ContentItemWithoutContent | null
  nextInSeries: ContentItemWithoutContent | null
  currentIndex: number
  totalInSeries: number
}> {
  const series = await getSeriesForItem(itemId)

  if (!series) {
    return { series: null, prevInSeries: null, nextInSeries: null, currentIndex: -1, totalInSeries: 0 }
  }

  const currentIndex = series.items.findIndex((i) => i.id === itemId)

  return {
    series,
    prevInSeries: currentIndex > 0 ? (series.items[currentIndex - 1] ?? null) : null,
    nextInSeries: currentIndex < series.items.length - 1 ? (series.items[currentIndex + 1] ?? null) : null,
    currentIndex,
    totalInSeries: series.items.length,
  }
}
