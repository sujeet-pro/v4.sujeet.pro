export interface MarkdownLinkOccurrence {
  url: string
  line: number
  context: string
}

function stripInlineCode(line: string): string {
  return line.replace(/`[^`]*`/g, "")
}

function normalizeMarkdownTarget(rawTarget: string): string {
  const trimmed = rawTarget.trim()
  if (!trimmed) return trimmed

  const withoutAngles = trimmed.startsWith("<") && trimmed.endsWith(">") ? trimmed.slice(1, -1) : trimmed
  const [firstToken] = withoutAngles.split(/\s+/)
  if (!firstToken) return ""
  return firstToken.replace(/^<|>$/g, "")
}

function buildContextSnippet(line: string, matchIndex: number, matchLength: number, maxLength = 160): string {
  const rawLine = line
  if (rawLine.trim().length <= maxLength) return rawLine.trim()

  const safeMatchIndex = Math.max(0, Math.min(matchIndex, rawLine.length))
  const half = Math.max(0, Math.floor((maxLength - matchLength) / 2))
  let start = Math.max(0, safeMatchIndex - half)
  let end = Math.min(rawLine.length, start + maxLength)
  if (end - start < maxLength) {
    start = Math.max(0, end - maxLength)
  }

  let snippet = rawLine.slice(start, end).trim()
  if (start > 0) snippet = `...${snippet}`
  if (end < rawLine.length) snippet = `${snippet}...`
  return snippet
}

function isLikelyAutolinkTarget(raw: string): boolean {
  if (!raw) return false
  if (raw.startsWith("#")) return true
  if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return true
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//")) return true
  if (raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("data:")) return true
  if (raw.includes("@")) return true
  if (/^[a-z][a-z0-9+.-]*:/.test(raw)) return true
  if (raw.startsWith("www.")) return true
  if (raw.includes("/") || raw.includes(".")) return true
  return false
}

function isHtmlClosingTagToken(raw: string): boolean {
  if (!raw.startsWith("/")) return false
  return /^\/[A-Za-z][A-Za-z0-9:-]*$/.test(raw)
}

export function extractMarkdownLinkOccurrences(content: string): MarkdownLinkOccurrence[] {
  const occurrences: MarkdownLinkOccurrence[] = []
  const lines = content.split(/\r?\n/)
  let inFence = false
  let fenceChar: string | null = null

  for (const [index, line] of lines.entries()) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/)
    if (fenceMatch) {
      const currentFence = fenceMatch[1]?.[0]
      if (!currentFence) continue
      if (!inFence) {
        inFence = true
        fenceChar = currentFence
        continue
      }
      if (fenceChar === currentFence) {
        inFence = false
        fenceChar = null
        continue
      }
    }

    if (inFence) continue

    const cleanedLine = stripInlineCode(line)
    const inlineLinkRegex = /!?\[[^\]]*\]\(([^)]+)\)/g
    let match: RegExpExecArray | null
    while ((match = inlineLinkRegex.exec(cleanedLine)) !== null) {
      if (!match[1]) continue
      const normalized = normalizeMarkdownTarget(match[1])
      if (!normalized) continue
      const context = buildContextSnippet(cleanedLine, match.index ?? 0, match[0].length)
      occurrences.push({
        url: normalized,
        line: index + 1,
        context,
      })
    }

    const referenceLinkRegex = /^\s*\[[^\]]+\]:\s*(.+)$/g
    while ((match = referenceLinkRegex.exec(cleanedLine)) !== null) {
      if (!match[1]) continue
      const normalized = normalizeMarkdownTarget(match[1])
      if (!normalized) continue
      const context = buildContextSnippet(cleanedLine, match.index ?? 0, match[0].length)
      occurrences.push({
        url: normalized,
        line: index + 1,
        context,
      })
    }

    const autolinkRegex = /<([^\s>]+)>/g
    while ((match = autolinkRegex.exec(cleanedLine)) !== null) {
      if (!match[1]) continue
      const normalized = normalizeMarkdownTarget(match[1])
      if (!normalized || isHtmlClosingTagToken(normalized) || !isLikelyAutolinkTarget(normalized)) continue
      const context = buildContextSnippet(cleanedLine, match.index ?? 0, match[0].length)
      occurrences.push({
        url: normalized,
        line: index + 1,
        context,
      })
    }
  }

  return occurrences
}
