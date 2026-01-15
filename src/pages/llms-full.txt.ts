import { generateLlmsFullTxt } from "@/utils/llms.utils"
import type { APIRoute } from "astro"

export const GET: APIRoute = async () => {
  const content = await generateLlmsFullTxt()

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
