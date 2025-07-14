import { type ReferenceDataEntry, getCollection } from "astro:content"
import type { Tag } from "./content.type"

export async function getTagsByRefs(refs: ReferenceDataEntry<"tags">[]) {
  const tagsCollection = await getCollection("tags")

  // Handle both string tags and reference tags
  const tagIds = refs.map((ref) => (typeof ref === "string" ? ref : ref.id))
  const validTagIds = new Set(tagIds)

  const tags = tagsCollection
    .filter((tag) => validTagIds.has(tag.id))
    .map(
      (tag): Tag => ({
        id: tag.id,
        name: tag.data.name,
        href: `/tag/${tag.id}`,
      }),
    )
  if (tags.length !== validTagIds.size) {
    const invalidTagIds = Array.from(validTagIds).filter((id) => !tags.some((tag) => tag.id === id))
    throw new Error(`Invalid tag IDs: ${invalidTagIds.join(", ")}`)
  }
  return tags
}

export async function getAllTags(): Promise<Tag[]> {
  const tagsCollection = await getCollection("tags")
  return tagsCollection.map(
    (tag): Tag => ({
      id: tag.id,
      name: tag.data.name,
      href: `/tag/${tag.id}`,
    }),
  )
}
