import type { RemarkPlugin } from "node_modules/@astrojs/markdown-remark/dist/types";

export const remarkAutoFrontmatterLayout: RemarkPlugin = (options: { defaultLayout: string }) => {
  return function (_tree, file) {
    if (file.data.astro?.frontmatter && !file.data.astro.frontmatter.layout) {
      file.data.astro.frontmatter.layout = options.defaultLayout;
    }
  };
};
