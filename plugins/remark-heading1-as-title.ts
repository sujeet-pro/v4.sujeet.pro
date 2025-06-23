import { toString } from "mdast-util-to-string";
import type { RemarkPlugin } from "node_modules/@astrojs/markdown-remark/dist/types";

export const remarkHeading1AsFrontmatterTitle: RemarkPlugin = () => {
  return function (tree, file) {
    if (!file.data.astro?.frontmatter) {
      return undefined;
    }
    if (file.data.astro.frontmatter.title) {
      return undefined;
    }
    const h1 = tree.children.find((child) => child.type === "heading" && child.depth === 1);
    if (!h1) {
      return undefined;
    }
    const title = toString(h1);
    file.data.astro.frontmatter.title = title;
    // Remove the h1 heading from the tree after extracting the title
    const h1Index = tree.children.indexOf(h1);
    if (h1Index !== -1) {
      tree.children.splice(h1Index, 1);
    }
  };
};
