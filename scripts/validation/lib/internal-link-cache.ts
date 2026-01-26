import * as path from "node:path"

export function resolveWithCandidateCache<T>(cache: Map<string, T>, candidates: string[], resolver: () => T): T {
  const cacheKey = candidates.map((candidate) => path.resolve(candidate)).join("|")
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T
  }
  const result = resolver()
  cache.set(cacheKey, result)
  return result
}
