import { execSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Define paths
const projectRoot = join(__dirname, "..")
const sourceDir = join(projectRoot, "node_modules", "katex")
const targetDir = join(projectRoot, "public", "katex-v1")

// Files to copy
const filesToCopy = ["dist/katex.min.css", "dist/fonts"]

function copyFile(sourcePath: string, targetPath: string) {
  try {
    // Ensure target directory exists
    const targetDirPath = dirname(targetPath)
    if (!existsSync(targetDirPath)) {
      mkdirSync(targetDirPath, { recursive: true })
    }

    copyFileSync(sourcePath, targetPath)
    console.log(`✅ Copied: ${sourcePath} -> ${targetPath}`)
  } catch (error) {
    console.error(`❌ Failed to copy ${sourcePath}:`, error)
  }
}

function copyDirectory(sourceDir: string, targetDir: string) {
  try {
    // Use cp command for directory copying (works on Unix-like systems)
    execSync(`cp -r "${sourceDir}" "${targetDir}"`, { stdio: "inherit" })
    console.log(`✅ Copied directory: ${sourceDir} -> ${targetDir}`)
  } catch (error) {
    console.error(`❌ Failed to copy directory ${sourceDir}:`, error)
  }
}

function main() {
  console.log("🚀 Starting KaTeX assets copy...")

  // Ensure target directory exists
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
    console.log(`📁 Created directory: ${targetDir}`)
  }

  for (const file of filesToCopy) {
    const sourcePath = join(sourceDir, file)
    const targetPath = join(targetDir, file.split("/").pop() ?? file)

    if (existsSync(sourcePath)) {
      if (file === "dist/fonts") {
        // Copy fonts directory
        copyDirectory(sourcePath, join(targetDir, "fonts"))
      } else {
        // Copy individual file
        copyFile(sourcePath, targetPath)
      }
    } else {
      console.warn(`⚠️  Source file not found: ${sourcePath}`)
    }
  }

  console.log("✨ KaTeX assets copy completed!")
}

main()
