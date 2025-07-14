import type { Root } from "hast"
import type { Plugin } from "unified"

const rehypeImgClass: Plugin<[], Root> = () => {
  return (tree) => {
    const visit = (node: any) => {
      if (node.type === "element" && node.tagName === "img") {
        const src = node.properties?.src
        if (src && typeof src === "string") {
          // Check if the path ends with .invert.png
          if (src.endsWith(".invert.png")) {
            // Add dark:invert class to existing classes or create new class attribute
            const existingClasses = node.properties?.class || []
            const classes = Array.isArray(existingClasses) ? existingClasses : [existingClasses]

            if (!classes.includes("img-invert")) {
              node.properties.class = [...classes, "img-invert"]
            }
          }
        }
      }

      // Recursively visit children
      if (node.children) {
        node.children.forEach(visit)
      }
    }

    visit(tree)
  }
}

export default rehypeImgClass
