import * as fs from "node:fs"

const DEFAULT_TIMEOUT_MS = 10000

export interface HtmlFetchResult {
  ok: boolean
  status: number | null
  html?: string
}

export function fetchHtmlFromFile(filePath: string): HtmlFetchResult {
  try {
    const html = fs.readFileSync(filePath, "utf-8")
    return { ok: true, status: 200, html }
  } catch {
    return { ok: false, status: null }
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "ValidateBot/1.0" },
      redirect: "follow",
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchHtmlFromUrl(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<HtmlFetchResult> {
  try {
    const response = await fetchWithTimeout(url, timeoutMs)
    if (!response.ok) {
      response.body?.cancel()
      return { ok: false, status: response.status }
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html")) {
      response.body?.cancel()
      return { ok: true, status: response.status }
    }

    const html = await response.text()
    return { ok: true, status: response.status, html }
  } catch {
    return { ok: false, status: null }
  }
}
