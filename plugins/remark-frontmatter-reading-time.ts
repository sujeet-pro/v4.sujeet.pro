import { toString } from "mdast-util-to-string";
import type { RemarkPlugin } from "node_modules/@astrojs/markdown-remark/dist/types";
import getReadingTime from "reading-time";

export const remarkReadingTime: RemarkPlugin = () => {
  return function (tree, file) {
    if (!file.data.astro?.frontmatter) {
      return undefined;
    }
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    file.data.astro.frontmatter.minutesRead = readingTime.text;
  };
};
