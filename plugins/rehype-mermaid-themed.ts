import { createHash } from "node:crypto"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import type { Element, ElementContent, Root } from "hast"
import { toText } from "hast-util-to-text"
import { createMermaidRenderer } from "mermaid-isomorphic"
import type { Plugin } from "unified"

const OUTPUT_DIR = join(process.cwd(), "public", "_mermaid")

let cleaned = false

function ensureOutputDir() {
  if (!cleaned) {
    if (existsSync(OUTPUT_DIR)) {
      rmSync(OUTPUT_DIR, { recursive: true, force: true })
    }
    cleaned = true
  }
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function contentHash(source: string): string {
  return createHash("md5").update(source).digest("hex").slice(0, 8)
}

interface MermaidInstance {
  diagram: string
  parent: Element
  nodeIndex: number
}

function findMermaidBlocks(tree: Root): MermaidInstance[] {
  const instances: MermaidInstance[] = []

  function visit(node: any, parent?: Element) {
    if (node.type === "element") {
      // Case 1: <pre><code class="language-mermaid">
      if (node.tagName === "code") {
        const classes = node.properties?.className
        const classList = Array.isArray(classes) ? classes : typeof classes === "string" ? [classes] : []
        if (classList.includes("language-mermaid") && parent?.tagName === "pre") {
          const diagram = toText(node, { whitespace: "pre" }).trim()
          if (diagram) {
            // Find <pre> in its grandparent — we need to replace the <pre>, not the <code>
            // The parent/indexInParent here point to <pre>/<code-index>
            // We actually need the parent of the <pre>
            instances.push({ diagram, parent: parent as any, nodeIndex: -1 })
          }
        }
      }

      // Case 2: <pre class="mermaid">
      if (node.tagName === "pre") {
        const classes = node.properties?.className
        const classList = Array.isArray(classes) ? classes : typeof classes === "string" ? [classes] : []
        if (classList.includes("mermaid")) {
          const diagram = toText(node, { whitespace: "pre" }).trim()
          if (diagram) {
            instances.push({ diagram, parent: node, nodeIndex: -1 })
          }
        }
      }
    }

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        visit(node.children[i], node)
      }
    }
  }

  visit(tree)
  return instances
}

/**
 * Walks the tree to find the parent and index of a target node.
 * Returns { parent, index } or null.
 */
function findParentOf(tree: Root, target: Element): { parent: any; index: number } | null {
  function walk(node: any): { parent: any; index: number } | null {
    if (!node.children) return null
    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i] === target) {
        return { parent: node, index: i }
      }
      const found = walk(node.children[i])
      if (found) return found
    }
    return null
  }
  return walk(tree)
}

const rehypeMermaidThemed: Plugin<[], Root> = () => {
  const renderDiagrams = createMermaidRenderer()

  return async (tree) => {
    // Find all mermaid blocks — for <pre><code class="language-mermaid">,
    // instance.parent is the <pre> element
    const rawInstances = findMermaidBlocks(tree)
    if (rawInstances.length === 0) return

    // Resolve each instance's actual parent-in-tree and index
    // For <pre><code class="language-mermaid">, we stored the <pre> as parent
    // but we need to replace the <pre> in ITS parent
    const instances: { diagram: string; treeParent: any; treeIndex: number }[] = []

    for (const inst of rawInstances) {
      // For <pre class="mermaid"> case, inst.parent IS the <pre> node
      // For <pre><code class="language-mermaid"> case, inst.parent is also the <pre> node
      // In both cases, find the <pre>'s parent in the tree
      const preNode = inst.parent
      // Check if this is a <pre> that contains <code class="language-mermaid">
      const isPreWithCode =
        preNode.tagName === "pre" &&
        preNode.children?.some(
          (c: any) =>
            c.type === "element" &&
            c.tagName === "code" &&
            (Array.isArray(c.properties?.className) ? c.properties.className : [c.properties?.className]).includes(
              "language-mermaid",
            ),
        )
      const isPreMermaid =
        preNode.tagName === "pre" &&
        (Array.isArray(preNode.properties?.className)
          ? preNode.properties.className
          : [preNode.properties?.className]
        ).includes("mermaid")

      if (isPreWithCode || isPreMermaid) {
        const location = findParentOf(tree, preNode)
        if (location) {
          instances.push({ diagram: inst.diagram, treeParent: location.parent, treeIndex: location.index })
        }
      }
    }

    if (instances.length === 0) return

    const diagrams = instances.map((i) => i.diagram)

    ensureOutputDir()

    // Dark theme variables — higher contrast for readability on dark backgrounds.
    // Node fills use #2d2d2d (elevated surface) so they stand out from page bg (#111).
    // Borders use #555 for clear edges. Text stays #e5e5e5 to match site typography.
    const darkThemeVariables = {
      background: "#111111",
      primaryColor: "#2d2d2d",
      primaryTextColor: "#e5e5e5",
      primaryBorderColor: "#555555",
      secondaryColor: "#333333",
      secondaryTextColor: "#cccccc",
      secondaryBorderColor: "#555555",
      tertiaryColor: "#252525",
      tertiaryTextColor: "#cccccc",
      tertiaryBorderColor: "#555555",
      lineColor: "#cccccc",
      textColor: "#e5e5e5",
      mainBkg: "#2d2d2d",
      nodeBkg: "#2d2d2d",
      nodeBorder: "#555555",
      clusterBkg: "#1e1e1e",
      clusterBorder: "#555555",
      titleColor: "#e5e5e5",
      edgeLabelBackground: "#1e1e1e",
      actorBorder: "#555555",
      actorBkg: "#2d2d2d",
      actorTextColor: "#e5e5e5",
      actorLineColor: "#888888",
      signalColor: "#cccccc",
      signalTextColor: "#e5e5e5",
      labelBoxBkgColor: "#2d2d2d",
      labelBoxBorderColor: "#555555",
      labelTextColor: "#e5e5e5",
      loopTextColor: "#e5e5e5",
      noteBorderColor: "#555555",
      noteBkgColor: "#333333",
      noteTextColor: "#e5e5e5",
      activationBorderColor: "#555555",
      activationBkgColor: "#333333",
      defaultLinkColor: "#cccccc",
      arrowheadColor: "#cccccc",
    }

    // Render light and dark variants in parallel
    const [lightResults, darkResults] = await Promise.all([
      renderDiagrams(diagrams, { mermaidConfig: { theme: "default" } }),
      renderDiagrams(diagrams, { mermaidConfig: { theme: "base", themeVariables: darkThemeVariables } }),
    ])

    for (let i = 0; i < instances.length; i++) {
      const light = lightResults[i]
      const dark = darkResults[i]

      if (light?.status !== "fulfilled" || dark?.status !== "fulfilled") {
        const reason = light?.status === "rejected" ? (light as any).reason : (dark as any)?.reason
        console.warn(`[rehype-mermaid-themed] Failed to render diagram: ${reason}`)
        continue
      }

      const hash = contentHash(instances[i]!.diagram)
      const lightPath = join(OUTPUT_DIR, `${hash}-light.svg`)
      const darkPath = join(OUTPUT_DIR, `${hash}-dark.svg`)

      writeFileSync(lightPath, light.value.svg)
      writeFileSync(darkPath, dark.value.svg)

      const lightSrc = `/_mermaid/${hash}-light.svg`
      const darkSrc = `/_mermaid/${hash}-dark.svg`

      // Build replacement <img> element
      const imgNode: Element = {
        type: "element",
        tagName: "img",
        properties: {
          className: ["mermaid-diagram"],
          src: lightSrc,
          "data-src-light": lightSrc,
          "data-src-dark": darkSrc,
          alt: light.value.description || "Mermaid diagram",
          width: light.value.width,
          height: light.value.height,
          loading: "lazy",
        },
        children: [],
      }

      const { treeParent, treeIndex } = instances[i]!
      treeParent.children[treeIndex] = imgNode as ElementContent
    }
  }
}

export default rehypeMermaidThemed
