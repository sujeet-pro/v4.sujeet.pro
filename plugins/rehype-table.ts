import type { Root } from "hast"
import type { Plugin } from "unified"

/**
 * Rehype plugin that wraps each table in a .table-container div for overflow handling.
 */
const rehypeTable: Plugin<[], Root> = () => {
  return (tree) => {
    const visit = (node: any, index: number | null, parent: any) => {
      if (node.type === "element" && node.tagName === "table") {
        // Wrap table in container
        if (parent && index !== null) {
          const wrapper = {
            type: "element",
            tagName: "div",
            properties: { class: ["table-container"] },
            children: [node],
          }
          parent.children[index] = wrapper
        }
      }

      // Recursively visit children
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          visit(node.children[i], i, node)
        }
      }
    }

    visit(tree, null, null)
  }
}

export default rehypeTable
