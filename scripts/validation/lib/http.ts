const DEFAULT_TIMEOUT_MS = 10000
const DEFAULT_USER_AGENT = "ValidateBot/1.0"
export const DEFAULT_BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

export interface UrlCheckResult {
  url: string
  ok: boolean
  status: number | null
  error?: string
}

async function fetchWithTimeoutAndAgent(
  url: string,
  method: string,
  timeoutMs: number,
  userAgent: string | null,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const init: RequestInit = {
      method,
      signal: controller.signal,
      redirect: "follow",
    }
    if (userAgent) {
      init.headers = { "User-Agent": userAgent }
    }
    return await fetch(url, init)
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function checkUrl(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<UrlCheckResult> {
  try {
    const headResponse = await fetchWithTimeoutAndAgent(url, "HEAD", timeoutMs, DEFAULT_USER_AGENT)
    headResponse.body?.cancel()

    if (headResponse.ok) {
      return { url, ok: true, status: headResponse.status }
    }

    const getResponse = await fetchWithTimeoutAndAgent(url, "GET", timeoutMs, DEFAULT_USER_AGENT)
    getResponse.body?.cancel()

    if (getResponse.ok) {
      return { url, ok: true, status: getResponse.status }
    }

    return { url, ok: false, status: getResponse.status, error: `HTTP ${getResponse.status}` }
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export interface FetchCheckOptions {
  timeoutMs?: number
  userAgent?: string | null
  expectedStatus?: number
}

export async function checkUrlWithFetch(url: string, options: FetchCheckOptions = {}): Promise<UrlCheckResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const expectedStatus = options.expectedStatus ?? 200
  const userAgent = options.userAgent === undefined ? DEFAULT_USER_AGENT : options.userAgent

  try {
    const headResponse = await fetchWithTimeoutAndAgent(url, "HEAD", timeoutMs, userAgent)
    headResponse.body?.cancel()

    if (headResponse.status === expectedStatus) {
      return { url, ok: true, status: headResponse.status }
    }

    const getResponse = await fetchWithTimeoutAndAgent(url, "GET", timeoutMs, userAgent)
    getResponse.body?.cancel()

    if (getResponse.status === expectedStatus) {
      return { url, ok: true, status: getResponse.status }
    }

    return { url, ok: false, status: getResponse.status, error: `HTTP ${getResponse.status}` }
  } catch (error) {
    return {
      url,
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
