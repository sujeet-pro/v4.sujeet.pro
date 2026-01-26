import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const LOGS_DIR = join(process.cwd(), "logs")

type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS"

interface LoggerOptions {
  humanReadable?: boolean
}

export class Logger {
  private logFile: string
  private summaryFile: string
  private logs: string[] = []
  private indentLevel = 0
  private indentToken = "  "
  private humanReadable: boolean

  constructor(prefix: string, options: LoggerOptions = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const baseName = `${prefix}-${timestamp}`
    this.logFile = join(LOGS_DIR, `${baseName}.log`)
    this.summaryFile = join(LOGS_DIR, `${baseName}.summary.json`)
    mkdirSync(LOGS_DIR, { recursive: true })
    this.humanReadable = options.humanReadable ?? false
  }

  log(message: string, level: LogLevel = "INFO") {
    const timestamp = new Date().toISOString()
    const indent = this.indentLevel > 0 ? this.indentToken.repeat(this.indentLevel) : ""
    const plainLine = `${indent}${message}`
    const logLine = this.humanReadable ? plainLine : `[${timestamp}] [${level}] ${plainLine}`
    this.logs.push(logLine)

    const colors: Record<LogLevel, string> = {
      INFO: "\x1b[36m",
      WARN: "\x1b[33m",
      ERROR: "\x1b[31m",
      SUCCESS: "\x1b[32m",
    }

    const consoleLine = this.humanReadable ? plainLine : logLine
    console.log(`${colors[level]}${consoleLine}\x1b[0m`)
  }

  info(message: string) {
    this.log(message, "INFO")
  }

  warn(message: string) {
    this.log(message, "WARN")
  }

  error(message: string) {
    this.log(message, "ERROR")
  }

  success(message: string) {
    this.log(message, "SUCCESS")
  }

  group(message: string, level: LogLevel = "INFO") {
    this.log(message, level)
    this.indentLevel += 1
  }

  groupEnd() {
    if (this.indentLevel > 0) {
      this.indentLevel -= 1
    }
  }

  save() {
    writeFileSync(this.logFile, this.logs.join("\n"))
    console.log(`\n\x1b[36mLogs saved to: ${this.logFile}\x1b[0m`)
  }

  saveSummary(summary: unknown) {
    writeFileSync(this.summaryFile, `${JSON.stringify(summary, null, 2)}\n`)
    return this.summaryFile
  }
}
