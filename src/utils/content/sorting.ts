/**
 * Content sorting utilities
 */

/**
 * Sort items by an ordering array.
 * Items not in the order array are placed at the end.
 */
export function sortByOrdering<T>(items: T[], order: string[], getId: (item: T) => string): T[] {
  if (order.length === 0) return items

  const orderMap = new Map(order.map((id, idx) => [id, idx]))

  return [...items].sort((a, b) => {
    const aIdx = orderMap.get(getId(a)) ?? Infinity
    const bIdx = orderMap.get(getId(b)) ?? Infinity
    return aIdx - bIdx
  })
}

/**
 * Sort items with an `id` property by an ordering array
 */
export function sortByOrderingWithId<T extends { id: string }>(items: T[], order: string[]): T[] {
  return sortByOrdering(items, order, (item) => item.id)
}
