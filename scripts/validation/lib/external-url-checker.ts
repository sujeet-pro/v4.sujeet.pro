import type { Browser, BrowserContext } from "playwright"
import type { ExternalLinkCacheEntry, ExternalLinkHint, ExternalLinkManualState } from "./external-link-cache"
import { isCacheFresh, loadExternalLinkCache, normalizeManualState, saveExternalLinkCache } from "./external-link-cache"
import { DEFAULT_THROTTLE_RPS, NO_THROTTLE_HOSTS } from "./external-link-config"
import type { UrlCheckResult } from "./http"
import { DEFAULT_BROWSER_USER_AGENT, checkUrlWithFetch } from "./http"

export interface ExternalUrlCheckResult extends UrlCheckResult {
  fromCache: boolean
  hint?: ExternalLinkHint
  warning?: string
}

export interface ExternalUrlCheckSummary {
  total: number
  fromCache: number
  checked: number
  warnings: number
}

export interface ExternalUrlCheckOptions {
  cachePath?: string
  maxAgeDays?: number
  timeoutMs?: number
  concurrency?: number
  playwrightConcurrency?: number
  forceFullCheck?: boolean
  onProgress?: (progress: {
    total: number
    checked: number
    success: number
    failed: number
    inProgress: number
  }) => void
}

const DEFAULT_MAX_AGE_DAYS = 30
const DEFAULT_THROTTLE_MS = Math.round(1000 / DEFAULT_THROTTLE_RPS)
const DEFAULT_TIMEOUT_MS = 10000
const DEFAULT_CONCURRENCY = 10
const DEFAULT_PLAYWRIGHT_CONCURRENCY = 2

const HINT_SEQUENCE: ExternalLinkHint[] = ["fetch-node", "fetch-browser-agent", "playwright", "manual"]
const HINT_SET = new Set<ExternalLinkHint>(HINT_SEQUENCE)

export async function validateExternalUrls(
  urls: string[],
  options: ExternalUrlCheckOptions = {},
): Promise<{ results: ExternalUrlCheckResult[]; summary: ExternalUrlCheckSummary }> {
  const uniqueUrls = Array.from(new Set(urls))
  const cachePath = options.cachePath
  const maxAgeDays = options.maxAgeDays ?? DEFAULT_MAX_AGE_DAYS
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY
  const playwrightConcurrency = options.playwrightConcurrency ?? DEFAULT_PLAYWRIGHT_CONCURRENCY
  const forceFullCheck = options.forceFullCheck ?? false

  const cache = loadExternalLinkCache(cachePath)
  const now = Date.now()
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000

  const results: ExternalUrlCheckResult[] = []
  const toCheck: string[] = []

  for (const url of uniqueUrls) {
    if (forceFullCheck) {
      toCheck.push(url)
      continue
    }
    const cached = cache.entries[url]
    if (cached && isValidCacheEntry(cached, now, maxAgeMs)) {
      const cachedHint = normalizeHint(cached.hint)
      results.push({
        url,
        ok: cached.ok,
        status: cached.status,
        fromCache: true,
        ...(cachedHint ? { hint: cachedHint } : {}),
        ...(cached.error !== undefined ? { error: cached.error } : {}),
      })
      continue
    }
    toCheck.push(url)
  }

  const progress = {
    total: toCheck.length,
    checked: 0,
    success: 0,
    failed: 0,
    inProgress: 0,
  }
  const reportProgress = () => {
    options.onProgress?.({ ...progress })
  }

  reportProgress()

  const playwrightChecker = new PlaywrightChecker(timeoutMs, playwrightConcurrency)

  try {
    const checkedResults = await processWithConcurrency(toCheck, concurrency, async (url) => {
      progress.inProgress += 1
      reportProgress()

      let result: UrlCheckResult
      let hint: ExternalLinkHint
      let warning: string | undefined
      let manual: ExternalLinkManualState | undefined

      try {
        const cached = cache.entries[url]
        const outcome = await checkExternalUrl(url, cached, timeoutMs, playwrightChecker, forceFullCheck)
        result = outcome.result
        hint = outcome.hint
        warning = outcome.warning
        manual = outcome.manual
      } catch (error) {
        result = {
          url,
          ok: false,
          status: null,
          error: error instanceof Error ? error.message : "Unknown error",
        }
        hint = "manual"
      }

      const entry: ExternalLinkCacheEntry = {
        status: result.status,
        ok: result.ok,
        lastChecked: new Date().toISOString(),
        ...(result.error !== undefined ? { error: result.error } : {}),
        hint,
        ...(manual !== undefined ? { manual } : {}),
      }

      cache.entries[url] = entry

      progress.inProgress = Math.max(0, progress.inProgress - 1)
      progress.checked += 1
      if (result.ok) {
        progress.success += 1
      } else {
        progress.failed += 1
      }
      reportProgress()

      return {
        ...result,
        fromCache: false,
        hint,
        ...(warning ? { warning } : {}),
      }
    })

    if (checkedResults.length > 0) {
      saveExternalLinkCache(cache, cachePath)
    }

    results.push(...checkedResults)
  } finally {
    await playwrightChecker.close()
  }

  const warningCount = results.filter((result) => result.warning).length

  return {
    results,
    summary: {
      total: uniqueUrls.length,
      fromCache: results.filter((result) => result.fromCache).length,
      checked: results.filter((result) => !result.fromCache).length,
      warnings: warningCount,
    },
  }
}

function isValidCacheEntry(entry: ExternalLinkCacheEntry, now: number, maxAgeMs: number) {
  if (!entry.ok || entry.status !== 200) return false
  const manual = normalizeManualState(entry.manual)
  if (manual === "auto" || manual === false) return false
  return isCacheFresh(entry, now, maxAgeMs)
}

function normalizeHint(hint: unknown): ExternalLinkHint | null {
  if (typeof hint !== "string") return null
  if (HINT_SET.has(hint as ExternalLinkHint)) {
    return hint as ExternalLinkHint
  }
  return null
}

function getHintSequence(hint: ExternalLinkHint | null): ExternalLinkHint[] {
  if (!hint) return HINT_SEQUENCE
  const startHint = hint === "manual" ? "playwright" : hint
  const index = HINT_SEQUENCE.indexOf(startHint)
  return index >= 0 ? HINT_SEQUENCE.slice(index) : HINT_SEQUENCE
}

async function checkExternalUrl(
  url: string,
  cached: ExternalLinkCacheEntry | undefined,
  timeoutMs: number,
  playwrightChecker: PlaywrightChecker,
  ignoreCachedState: boolean,
): Promise<{
  result: UrlCheckResult
  hint: ExternalLinkHint
  warning?: string
  manual?: ExternalLinkManualState
}> {
  const hint = ignoreCachedState ? null : normalizeHint(cached?.hint)
  const manualState = ignoreCachedState ? null : normalizeManualState(cached?.manual)
  const manualPersist = manualState === "auto" ? undefined : (manualState ?? undefined)
  const manualPayload = manualPersist !== undefined ? { manual: manualPersist } : {}
  const sequence = getHintSequence(hint)
  let lastFailure: UrlCheckResult | null = null

  for (const step of sequence) {
    if (step === "fetch-node") {
      const result = await checkUrlThrottled(url, timeoutMs, null)
      if (result.ok) {
        return { result, hint: step, ...manualPayload }
      }
      lastFailure = result
      continue
    }

    if (step === "fetch-browser-agent") {
      const result = await checkUrlThrottled(url, timeoutMs, DEFAULT_BROWSER_USER_AGENT)
      if (result.ok) {
        return { result, hint: step, ...manualPayload }
      }
      lastFailure = result
      continue
    }

    if (step === "playwright") {
      const result = await playwrightChecker.check(url)
      if (result.ok) {
        return { result, hint: step, ...manualPayload }
      }
      lastFailure = result
      continue
    }

    if (step === "manual") {
      return evaluateManual(url, manualState, lastFailure)
    }
  }

  return evaluateManual(url, manualState, lastFailure)
}

function evaluateManual(
  url: string,
  manualState: ExternalLinkManualState | null,
  lastFailure: UrlCheckResult | null,
): {
  result: UrlCheckResult
  hint: ExternalLinkHint
  warning?: string
  manual?: ExternalLinkManualState
} {
  const value = manualState ?? "auto"

  if (value === false) {
    return {
      result: {
        url,
        ok: false,
        status: lastFailure?.status ?? null,
        error: "Manual validation set to false",
      },
      hint: "manual",
      manual: value,
    }
  }

  if (value === true) {
    return {
      result: { url, ok: true, status: 200 },
      hint: "manual",
      manual: value,
    }
  }

  return {
    result: {
      url,
      ok: true,
      status: lastFailure?.status ?? null,
      ...(lastFailure?.error ? { error: lastFailure.error } : {}),
    },
    hint: "manual",
    warning: "Manual validation pending (auto)",
    manual: value,
  }
}

async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let index = 0
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = items[index]
      index += 1
      if (current === undefined) continue
      const result = await processor(current)
      results.push(result)
    }
  })
  await Promise.all(workers)
  return results
}

const NO_THROTTLE_SET = new Set(NO_THROTTLE_HOSTS.map((host) => host.toLowerCase()))
const domainState = new Map<string, { nextAvailableAt: number; chain: Promise<void> }>()

function normalizeHost(host: string) {
  return host.toLowerCase()
}

function shouldThrottleHost(host: string) {
  const normalized = normalizeHost(host)
  for (const allowed of NO_THROTTLE_SET) {
    if (normalized === allowed || normalized.endsWith(`.${allowed}`)) {
      return false
    }
  }
  return true
}

function getUrlHost(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runThrottled<T>(url: string, runner: () => Promise<T>): Promise<T> {
  const host = getUrlHost(url)
  if (!host || !shouldThrottleHost(host)) {
    return runner()
  }

  const normalized = normalizeHost(host)
  const state = domainState.get(normalized) ?? { nextAvailableAt: 0, chain: Promise.resolve() }
  domainState.set(normalized, state)

  const run = state.chain.then(async () => {
    const now = Date.now()
    const waitMs = Math.max(0, state.nextAvailableAt - now)
    if (waitMs > 0) {
      await delay(waitMs)
    }
    const start = Date.now()
    state.nextAvailableAt = start + DEFAULT_THROTTLE_MS
    return runner()
  })

  state.chain = run.then(
    () => undefined,
    () => undefined,
  )

  return run
}

async function checkUrlThrottled(url: string, timeoutMs: number, userAgent: string | null): Promise<UrlCheckResult> {
  return runThrottled(url, () =>
    checkUrlWithFetch(url, {
      timeoutMs,
      userAgent,
      expectedStatus: 200,
    }),
  )
}

class ConcurrencyLimiter {
  private active = 0
  private queue: Array<() => void> = []

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await task()
    } finally {
      this.release()
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active += 1
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1
        resolve()
      })
    })
  }

  private release() {
    this.active = Math.max(0, this.active - 1)
    const next = this.queue.shift()
    if (next) next()
  }
}

class PlaywrightChecker {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private initPromise: Promise<BrowserContext> | null = null
  private initError: string | null = null
  private limiter: ConcurrencyLimiter
  private used = false
  private readonly timeoutMs: number

  constructor(timeoutMs: number, concurrency: number) {
    this.timeoutMs = timeoutMs
    this.limiter = new ConcurrencyLimiter(Math.max(1, concurrency))
  }

  async check(url: string): Promise<UrlCheckResult> {
    this.used = true
    return this.limiter.run(async () => {
      let context: BrowserContext
      try {
        context = await this.getContext()
      } catch (error) {
        return {
          url,
          ok: false,
          status: null,
          error: error instanceof Error ? error.message : "Playwright initialization failed",
        }
      }

      const page = await context.newPage()
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: this.timeoutMs })
        const status = response?.status() ?? null
        if (status === 200) {
          return { url, ok: true, status }
        }
        return {
          url,
          ok: false,
          status,
          error: status !== null ? `HTTP ${status}` : "No response",
        }
      } catch (error) {
        return {
          url,
          ok: false,
          status: null,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      } finally {
        await page.close()
      }
    })
  }

  async close() {
    if (!this.used) return
    if (this.context) {
      await this.context.close()
    }
    if (this.browser) {
      await this.browser.close()
    }
    this.context = null
    this.browser = null
  }

  private async getContext(): Promise<BrowserContext> {
    if (this.context) return this.context
    if (this.initError) {
      throw new Error(this.initError)
    }
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const { chromium } = await import("playwright")
        this.browser = await chromium.launch({ headless: true })
        this.context = await this.browser.newContext({ userAgent: DEFAULT_BROWSER_USER_AGENT })
        return this.context
      })().catch((error) => {
        const message = error instanceof Error ? error.message : "Playwright initialization failed"
        this.initError = message
        throw error
      })
    }
    return this.initPromise
  }
}
