import * as path from "node:path"
import { processInBatches } from "./lib/async"
import { DEFAULT_CACHE_PATH } from "./lib/external-link-cache"
import { validateExternalUrls } from "./lib/external-url-checker"
import { fetchHtmlFromUrl } from "./lib/html-fetch"
import { collectHtmlUrlRefsForPage } from "./lib/html-refs"
import { checkUrl } from "./lib/http"
import { Logger } from "./lib/logger"
import type { UrlKind } from "./lib/url-utils"
import { stripHash } from "./lib/url-utils"

const MAX_CONCURRENT_REQUESTS = 10
const REQUEST_TIMEOUT_MS = 10000

interface CrawlBucket {
  internal: Set<string>
  external: Set<string>
  total: number
}

interface CrawlResult {
  links: CrawlBucket
  images: CrawlBucket
  resources: CrawlBucket
  pagesVisited: number
  refs: CrawlRef[]
}

interface CrawlRef {
  sourcePage: string
  url: string
  kind: UrlKind
  external: boolean
}

interface LiveIssue {
  type: "internal" | "external"
  kind: UrlKind
  url: string
  status: number | null
  error?: string
}

function createBucket(): CrawlBucket {
  return { internal: new Set<string>(), external: new Set<string>(), total: 0 }
}

function shouldCrawl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname
    const ext = path.extname(pathname)
    if (!ext) return true
    return ext === ".html"
  } catch {
    return false
  }
}

async function crawlSite(baseUrl: string, logger: Logger): Promise<CrawlResult> {
  const queue: string[] = [baseUrl]
  const visited = new Set<string>()
  const refs: CrawlRef[] = []

  const buckets = {
    links: createBucket(),
    images: createBucket(),
    resources: createBucket(),
  }

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const normalizedCurrent = stripHash(current)
    if (visited.has(normalizedCurrent)) continue
    visited.add(normalizedCurrent)

    const page = await fetchHtmlFromUrl(normalizedCurrent, REQUEST_TIMEOUT_MS)
    if (!page.ok || !page.html) {
      logger.warn(`Failed to fetch page for crawl: ${normalizedCurrent}`)
      continue
    }

    const extracted = collectHtmlUrlRefsForPage(page.html, normalizedCurrent)

    for (const entry of extracted) {
      const bucketKey = entry.kind === "link" ? "links" : entry.kind === "image" ? "images" : "resources"
      const bucket = buckets[bucketKey]
      bucket.total += 1

      refs.push({
        sourcePage: normalizedCurrent,
        url: entry.resolvedUrl,
        kind: entry.kind,
        external: entry.external,
      })

      if (!entry.external) {
        bucket.internal.add(entry.resolvedUrl)
        if (entry.kind === "link" && shouldCrawl(entry.resolvedUrl)) {
          if (!visited.has(entry.resolvedUrl)) {
            queue.push(entry.resolvedUrl)
          }
        }
      } else {
        bucket.external.add(entry.resolvedUrl)
      }
    }
  }

  return {
    links: buckets.links,
    images: buckets.images,
    resources: buckets.resources,
    pagesVisited: visited.size,
    refs,
  }
}

async function checkUrls(urls: string[]): Promise<{ results: Awaited<ReturnType<typeof checkUrl>>[] }> {
  const results = await processInBatches(urls, MAX_CONCURRENT_REQUESTS, async (url) =>
    checkUrl(url, REQUEST_TIMEOUT_MS),
  )
  return { results }
}

function logFailures(label: string, failures: Awaited<ReturnType<typeof checkUrl>>[], logger: Logger) {
  if (failures.length > 0) {
    logger.error(`${label} failures: ${failures.length}`)
    for (const failure of failures) {
      logger.error(`${failure.url} -> ${failure.status ?? "Error"}${failure.error ? ` (${failure.error})` : ""}`)
    }
  } else {
    logger.success(`${label} passed.`)
  }
}

async function main() {
  const logger = new Logger("validate-live-site", { humanReadable: true })

  const urlArg = process.argv[2]
  if (!urlArg) {
    logger.error("Usage: npx tsx scripts/validation/validate-live-site.ts <url>")
    const summary = {
      schemaVersion: 1,
      tool: "validate-live-site",
      status: "fail",
      generatedAt: new Date().toISOString(),
      summary: {
        issues: 1,
        filesWithIssues: 0,
      },
      files: [],
      notes: ["Missing URL argument."],
    }
    const summaryPath = logger.saveSummary(summary)
    logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
    logger.save()
    process.exit(1)
  }

  let baseUrl: string
  try {
    baseUrl = new URL(urlArg).href
  } catch {
    logger.error(`Invalid URL: ${urlArg}`)
    const summary = {
      schemaVersion: 1,
      tool: "validate-live-site",
      status: "fail",
      generatedAt: new Date().toISOString(),
      summary: {
        issues: 1,
        filesWithIssues: 0,
      },
      files: [],
      notes: [`Invalid URL: ${urlArg}`],
    }
    const summaryPath = logger.saveSummary(summary)
    logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)
    logger.save()
    process.exit(1)
  }

  logger.info("=".repeat(60))
  logger.info("Live Site Validation")
  logger.info("=".repeat(60))
  logger.info(`Base URL: ${baseUrl}`)
  logger.info("")

  logger.info("Crawling site...")
  const crawl = await crawlSite(baseUrl, logger)

  logger.info(`Pages visited: ${crawl.pagesVisited}`)
  logger.info(`Links found: ${crawl.links.total} (unique: ${crawl.links.internal.size + crawl.links.external.size})`)
  logger.info(
    `Images found: ${crawl.images.total} (unique: ${crawl.images.internal.size + crawl.images.external.size})`,
  )
  logger.info(
    `Resources found: ${crawl.resources.total} (unique: ${crawl.resources.internal.size + crawl.resources.external.size})`,
  )
  logger.info("")
  logger.info(`External cache: ${path.relative(process.cwd(), DEFAULT_CACHE_PATH)} (delete to revalidate all)`)
  logger.info("")

  const internalUrls = Array.from(
    new Set([...crawl.links.internal, ...crawl.images.internal, ...crawl.resources.internal]),
  )
  const { results: internalResults } = await checkUrls(internalUrls)
  const internalResultsMap = new Map(internalResults.map((result) => [result.url, result]))

  const internalLinkFailures = Array.from(crawl.links.internal)
    .map((url) => internalResultsMap.get(url))
    .filter((result): result is NonNullable<typeof result> => !!result)
    .filter((result) => !result.ok)
  const internalImageFailures = Array.from(crawl.images.internal)
    .map((url) => internalResultsMap.get(url))
    .filter((result): result is NonNullable<typeof result> => !!result)
    .filter((result) => !result.ok)
  const internalResourceFailures = Array.from(crawl.resources.internal)
    .map((url) => internalResultsMap.get(url))
    .filter((result): result is NonNullable<typeof result> => !!result)
    .filter((result) => !result.ok)

  logFailures("Internal links", internalLinkFailures, logger)
  logFailures("Internal images", internalImageFailures, logger)
  logFailures("Internal resources", internalResourceFailures, logger)

  const externalUrls = new Set<string>([...crawl.links.external, ...crawl.images.external, ...crawl.resources.external])

  logger.info("")
  logger.info(`External URLs to validate: ${externalUrls.size}`)

  const externalResults = await validateExternalUrls(Array.from(externalUrls))
  const externalResultsMap = new Map(externalResults.results.map((result) => [result.url, result]))
  const externalWarnings = externalResults.results.filter((result) => result.warning)

  logger.info(
    `External URLs checked: ${externalResults.summary.total} (cache: ${externalResults.summary.fromCache}, revalidated: ${externalResults.summary.checked})`,
  )

  if (externalWarnings.length > 0) {
    logger.warn(`External link warnings: ${externalWarnings.length}`)
    for (const warning of externalWarnings) {
      logger.warn(`${warning.url} - ${warning.warning}`)
    }
  }

  const externalLinkFailures = Array.from(crawl.links.external)
    .map((url) => externalResultsMap.get(url))
    .filter((result): result is NonNullable<typeof result> => !!result)
    .filter((result) => !result.ok)

  const externalImageFailures = Array.from(crawl.images.external)
    .map((url) => externalResultsMap.get(url))
    .filter((result): result is NonNullable<typeof result> => !!result)
    .filter((result) => !result.ok)

  const externalResourceFailures = Array.from(crawl.resources.external)
    .map((url) => externalResultsMap.get(url))
    .filter((result): result is NonNullable<typeof result> => !!result)
    .filter((result) => !result.ok)

  if (externalLinkFailures.length > 0) {
    logger.error(`External link failures: ${externalLinkFailures.length}`)
    for (const failure of externalLinkFailures) {
      logger.error(`${failure.url} -> ${failure.status ?? "Error"}${failure.error ? ` (${failure.error})` : ""}`)
    }
  } else {
    logger.success("External links passed.")
  }

  if (externalImageFailures.length > 0) {
    logger.error(`External image failures: ${externalImageFailures.length}`)
    for (const failure of externalImageFailures) {
      logger.error(`${failure.url} -> ${failure.status ?? "Error"}${failure.error ? ` (${failure.error})` : ""}`)
    }
  } else {
    logger.success("External images passed.")
  }

  if (externalResourceFailures.length > 0) {
    logger.error(`External resource failures: ${externalResourceFailures.length}`)
    for (const failure of externalResourceFailures) {
      logger.error(`${failure.url} -> ${failure.status ?? "Error"}${failure.error ? ` (${failure.error})` : ""}`)
    }
  } else {
    logger.success("External resources passed.")
  }

  const toFailureMap = (failures: { url: string; status: number | null; error?: string }[]) =>
    new Map(failures.map((failure) => [failure.url, failure]))

  const internalFailureMaps: Record<UrlKind, Map<string, { url: string; status: number | null; error?: string }>> = {
    link: toFailureMap(internalLinkFailures),
    image: toFailureMap(internalImageFailures),
    resource: toFailureMap(internalResourceFailures),
  }

  const externalFailureMaps: Record<UrlKind, Map<string, { url: string; status: number | null; error?: string }>> = {
    link: toFailureMap(externalLinkFailures),
    image: toFailureMap(externalImageFailures),
    resource: toFailureMap(externalResourceFailures),
  }

  const issuesByPage = new Map<string, LiveIssue[]>()
  const seenIssueKeys = new Set<string>()

  const pushIssue = (page: string, issue: LiveIssue) => {
    if (!issuesByPage.has(page)) {
      issuesByPage.set(page, [])
    }
    issuesByPage.get(page)?.push(issue)
  }

  for (const ref of crawl.refs) {
    const failureMap = ref.external ? externalFailureMaps[ref.kind] : internalFailureMaps[ref.kind]
    const failure = failureMap.get(ref.url)
    if (!failure) continue
    const issueKey = `${ref.sourcePage}::${ref.kind}::${ref.url}::${ref.external ? "external" : "internal"}`
    if (seenIssueKeys.has(issueKey)) continue
    seenIssueKeys.add(issueKey)

    const issue: LiveIssue = {
      type: ref.external ? "external" : "internal",
      kind: ref.kind,
      url: ref.url,
      status: failure.status ?? null,
    }
    if (failure.error !== undefined) {
      issue.error = failure.error
    }
    pushIssue(ref.sourcePage, issue)
  }

  const totalIssues = Array.from(issuesByPage.values()).reduce((acc, issues) => acc + issues.length, 0)

  if (totalIssues > 0) {
    logger.error(`Issues by page: ${totalIssues}`)
    const sortedPages = Array.from(issuesByPage.entries()).sort(([a], [b]) => a.localeCompare(b))
    for (const [page, issues] of sortedPages) {
      logger.group(`${page} - ${issues.length} issues`, "ERROR")
      for (const issue of issues) {
        const hasDetail = issue.status !== null && issue.status !== undefined ? true : !!issue.error
        const detail = hasDetail ? ` (${issue.status ?? "Error"}${issue.error ? `, ${issue.error}` : ""})` : ""
        logger.error(`${issue.type}/${issue.kind}: ${issue.url}${detail}`)
      }
      logger.groupEnd()
    }
  }

  const hasFailures =
    internalLinkFailures.length > 0 ||
    internalImageFailures.length > 0 ||
    internalResourceFailures.length > 0 ||
    externalLinkFailures.length > 0 ||
    externalImageFailures.length > 0 ||
    externalResourceFailures.length > 0

  const summary = {
    schemaVersion: 1,
    tool: "validate-live-site",
    status: hasFailures ? "fail" : "pass",
    generatedAt: new Date().toISOString(),
    summary: {
      issues: totalIssues,
      filesWithIssues: issuesByPage.size,
      pagesVisited: crawl.pagesVisited,
      baseUrl,
    },
    files: Array.from(issuesByPage.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([page, issues]) => ({
        file: page,
        issues: issues.map((issue) => ({
          type: issue.type,
          kind: issue.kind,
          url: issue.url,
          status: issue.status,
          error: issue.error ?? null,
        })),
      })),
  }
  const summaryPath = logger.saveSummary(summary)
  logger.info(`Summary saved to: ${path.relative(process.cwd(), summaryPath)}`)

  logger.save()
  process.exit(hasFailures ? 1 : 0)
}

main().catch((error) => {
  console.error("Validation failed:", error)
  process.exit(1)
})
