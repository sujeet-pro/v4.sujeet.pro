import type { RemarkPlugin } from "node_modules/@astrojs/markdown-remark/dist/types"

export const remarkCodeTitleUsingFile: RemarkPlugin = () => {
  return function (tree, _file) {
    tree.children.forEach((node) => {
      if (node.type === "code" && node.meta?.includes("file=")) {
        const filePathWithLineNumbers = node.meta.split("file=")[1]?.split(" ")[0]
        const [filePath, lineNumberRange] = filePathWithLineNumbers?.split("#") ?? []

        if (!node.meta.includes("title=") && filePath) {
          const title = filePath.split("/").pop() || filePath
          const titleWithoutDate = title.replace(/^\d{4}-\d{2}-\d{2}-/, "")
          node.meta = `${node.meta} title="${titleWithoutDate}"`
        }
        if (!node.lang && filePath) {
          const fileExtension = filePath.split(".").pop()
          if (fileExtension) {
            node.lang = fileExtension
          }
        }

        if (lineNumberRange) {
          const lineNumberMatch = lineNumberRange.match(/L(\d+)(?:-L(\d+))?$/)
          if (lineNumberMatch) {
            const startLine = lineNumberMatch[1]

            if (!node.meta.includes("showLineNumbers")) {
              node.meta = `${node.meta} showLineNumbers`
            }

            if (!node.meta.includes("startLineNumber=")) {
              node.meta = `${node.meta} startLineNumber=${startLine}`
            }
          }
        }
      }
    })
  }
}
