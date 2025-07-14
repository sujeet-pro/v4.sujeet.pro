import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const postsDir = "./content/posts"

// Define the reorganization mapping
const reorganizationMap = [
  // Programming posts
  {
    source: "programming/2023-03-01-js-pub-sub.md",
    target: "2023-03-01-js-pub-sub/index.md",
    assets: [],
  },
  {
    source: "programming/2023-03-11-js-error-as-return-value.md",
    target: "2023-03-11-js-error-as-return-value/index.md",
    assets: ["programming/2023-03-11-js-error-as-return-value"],
  },
  {
    source: "programming/2023-03-20-js-length-of-a-string.md",
    target: "2023-03-20-js-length-of-a-string/index.md",
    assets: ["programming/2023-03-20-js-length-of-a-string"],
  },
  {
    source: "programming/2023-03-21-js-implement-lru.md",
    target: "2023-03-21-js-implement-lru/index.md",
    assets: [],
  },
  {
    source: "programming/2025-01-23-js-exponential-backoff.md",
    target: "2025-01-23-js-exponential-backoff/index.md",
    assets: ["programming/2025-01-23"],
  },
  {
    source: "programming/2025-01-24-js-async-task-queue.md",
    target: "2025-01-24-js-async-task-queue/index.md",
    assets: ["programming/2025-01-24", "programming/2025-01-24-code-sample.ts"],
  },

  // Deep dives posts
  {
    source: "deep-dives/2023-08-10-critical-rendering-path.md",
    target: "2023-08-10-critical-rendering-path/index.md",
    assets: ["deep-dives/2023-08-10-critical-rendering-path"],
  },
  {
    source: "deep-dives/2025-02-06-nodejs-architecture.md",
    target: "2025-02-06-nodejs-architecture/index.md",
    assets: ["deep-dives/2025-02-06-nodejs-architecture"],
  },
  {
    source: "deep-dives/2025-02-07-nodejs-event-loop.md",
    target: "2025-02-07-nodejs-event-loop/index.md",
    assets: ["deep-dives/2025-02-07-nodejs-event-loop"],
  },
  {
    source: "deep-dives/2025-02-08-libuv-internals.md",
    target: "2025-02-08-libuv-internals/index.md",
    assets: ["deep-dives/2025-02-08-libuv-internals"],
  },
  {
    source: "deep-dives/2025-02-09-v8-javascript-engine-internals.md",
    target: "2025-02-09-v8-javascript-engine-internals/index.md",
    assets: ["deep-dives/2025-02-09-v8-javascript-engine-internals"],
  },
  {
    source: "deep-dives/2025-02-15-ignition-v8s-javascript-interpreter.md",
    target: "2025-02-15-ignition-v8s-javascript-interpreter/index.md",
    assets: ["deep-dives/2025-02-15-ignition-v8s-javascript-interpreter"],
  },
  {
    source: "deep-dives/2025-02-15-orinoco-v8-garbage-collection.md",
    target: "2025-02-15-orinoco-v8-garbage-collection/index.md",
    assets: [],
  },
  {
    source: "deep-dives/2025-02-15-turbofan-v8s-javascript-jit-compiler.md",
    target: "2025-02-15-turbofan-v8s-javascript-jit-compiler/index.md",
    assets: ["deep-dives/2025-02-15-turbofan-v8s-javascript-jit-compiler"],
  },

  // Features posts
  {
    source: "features/2024-01-18-unveiling-nginxs-proxy-cache-lock-for-ssr-generated-content.md",
    target: "2024-01-18-unveiling-nginxs-proxy-cache-lock-for-ssr-generated-content/index.md",
    assets: ["features/2024-01-18-unveiling-nginxs-proxy-cache-lock-for-ssr-generated-content"],
  },
  {
    source: "features/2024-01-20-ssg.md",
    target: "2024-01-20-ssg/index.md",
    assets: ["features/2024-01-20-ssg"],
  },
  {
    source: "features/2024-01-21-implementing-redirection-for-static-sites.md",
    target: "2024-01-21-implementing-redirection-for-static-sites/index.md",
    assets: ["features/2024-01-21-implementing-redirection-for-static-sites"],
  },
  {
    source: "features/2024-01-22-ssg-serving-pre-compressed.md",
    target: "2024-01-22-ssg-serving-pre-compressed/index.md",
    assets: [],
  },
  {
    source: "features/2024-01-23-improving-cls.md",
    target: "2024-01-23-improving-cls/index.md",
    assets: ["features/2024-01-23-improving-cls"],
  },
  {
    source: "features/2024-01-24-implementing-rollback-in-ssg-with-cloudfront.md",
    target: "2024-01-24-implementing-rollback-in-ssg-with-cloudfront/index.md",
    assets: ["features/2024-01-24-implementing-rollback-in-ssg-with-cloudfront"],
  },
  {
    source: "features/2024-01-27-micro-frontend-with-cloudflare-esi.md",
    target: "2024-01-27-micro-frontend-with-cloudflare-esi/index.md",
    assets: ["features/2024-01-27-micro-frontend-with-cloudflare-esi"],
  },

  // System design fundamentals posts
  {
    source: "system-design-fundamentals/2023-09-01-switching-http-version.md",
    target: "2023-09-01-switching-http-version/index.md",
    assets: [],
  },
  {
    source: "system-design-fundamentals/2025-02-20-video-streaming.md",
    target: "2025-02-20-video-streaming/index.md",
    assets: ["system-design-fundamentals/2025-02-20-video-streaming"],
  },
  {
    source: "system-design-fundamentals/2025-04-01-caching.md",
    target: "2025-04-01-caching/index.md",
    assets: [],
  },
]

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function copyFile(source, target) {
  ensureDirectoryExists(path.dirname(target))
  fs.copyFileSync(source, target)
  console.log(`Copied: ${source} -> ${target}`)
}

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    console.log(`Warning: Source directory doesn't exist: ${source}`)
    return
  }

  ensureDirectoryExists(target)

  const items = fs.readdirSync(source)
  for (const item of items) {
    const sourcePath = path.join(source, item)
    const targetPath = path.join(target, item)

    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath)
    } else {
      copyFile(sourcePath, targetPath)
    }
  }
}

function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
    console.log(`Removed: ${dirPath}`)
  }
}

function main() {
  console.log("Starting post reorganization...")

  // Process each reorganization entry
  for (const entry of reorganizationMap) {
    const sourcePath = path.join(postsDir, entry.source)
    const targetPath = path.join(postsDir, entry.target)

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`Warning: Source file doesn't exist: ${sourcePath}`)
      continue
    }

    // Copy markdown file
    copyFile(sourcePath, targetPath)

    // Copy assets
    for (const asset of entry.assets) {
      const assetSourcePath = path.join(postsDir, asset)
      const assetTargetPath = path.join(postsDir, path.dirname(entry.target), path.basename(asset))

      if (fs.existsSync(assetSourcePath)) {
        if (fs.statSync(assetSourcePath).isDirectory()) {
          copyDirectory(assetSourcePath, assetTargetPath)
        } else {
          copyFile(assetSourcePath, assetTargetPath)
        }
      } else {
        console.log(`Warning: Asset doesn't exist: ${assetSourcePath}`)
      }
    }
  }

  // Remove old directories
  const oldDirectories = ["programming", "deep-dives", "features", "system-design-fundamentals"]
  for (const dir of oldDirectories) {
    removeDirectory(path.join(postsDir, dir))
  }

  console.log("Post reorganization completed!")
}

main()
