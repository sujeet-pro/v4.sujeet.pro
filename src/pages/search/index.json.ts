import { buildSearchIndex } from "@/utils/search.utils"
import type { APIRoute } from "astro"

export const GET: APIRoute = async () => {
  const indexJson = await buildSearchIndex()

  return new Response(indexJson, {
    headers: {
      "Content-Type": "application/json",
    },
  })
}
