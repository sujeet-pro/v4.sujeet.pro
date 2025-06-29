import type * as mdast from "mdast";
import { toString } from "mdast-util-to-string";
import path from "node:path";
import type { RemarkPlugin } from "node_modules/@astrojs/markdown-remark/dist/types";
import getReadingTime from "reading-time";
import type { VFile } from "vfile";

export const remarkFrontmatterPlugin: RemarkPlugin = (options: { defaultLayout: string }) => {
  return function (tree: mdast.Root, file: VFile) {
    if (!file.data.astro?.frontmatter) {
      return undefined;
    }

    if (!file.path.startsWith(path.resolve("./content"))) {
      file.data.astro.frontmatter.layout ??= options.defaultLayout;
    }
    file.data.astro.frontmatter.minutesRead ??= getReadingTime(toString(tree)).text;
    const title = getTitle(tree, file) ?? file.data.astro.frontmatter.title;
    file.data.astro.frontmatter.title ??= title.replace(/^draft:\s*/i, "");
    file.data.astro.frontmatter.isDraft ??= title?.toLowerCase().trim().startsWith("draft:") ?? false;
    file.data.astro.frontmatter.publishedOn ??= getPublishedDate(file.path);
    file.data.astro.frontmatter.description ??= getDescription(tree, file);
    // console.log(tree);
    // console.log(
    //   Object.fromEntries(Object.entries(file.data.astro.frontmatter).map(([key, value]) => [key, value.toString()])),
    // );
  };
};

function getTitle(tree: mdast.Root, file: VFile) {
  const h1 = tree.children.find((child) => child.type === "heading" && child.depth === 1);

  if (!h1) {
    throw new Error(`Missing h1 heading in ${file.path}`);
  }
  return toString(h1, {
    includeHtml: false,
    includeImageAlt: false,
  });
}

function getDescription(tree: mdast.Root, file: VFile) {
  // get h1 index
  const h1Idx = tree.children.findIndex((child) => child.type === "heading" && child.depth === 1);
  if (h1Idx === -1) {
    throw new Error(`Missing h1 heading in ${file.path}`);
  }
  // Ensure we have a table of contents, after h1
  const tableOfContentsIndex = tree.children.findIndex(
    (child, idx) =>
      idx > h1Idx && child.type === "heading" && child.depth === 2 && toString(child) === "Table of Contents",
  );
  if (tableOfContentsIndex === -1) {
    throw new Error(`Missing "Table of Contents" heading in ${file.path}`);
  }

  // const firstNonParaIndex = tree.children.findIndex((child, idx) => idx > h1Idx && child.type !== "paragraph");
  // if (firstNonParaIndex === -1) {
  //   throw new Error(`Missing non-paragraph content in ${file.path}`);
  // }
  // const endIdx = Math.min(tableOfContentsIndex, firstNonParaIndex);
  const endIdx = tableOfContentsIndex;

  // Setting description from text between h1 and "Table of Contents"
  const description = toString(tree.children.slice(h1Idx + 1, endIdx), {
    includeHtml: false,
    includeImageAlt: false,
  });
  if (!description) {
    throw new Error(`Missing description in ${file.path}`);
  }
  return description;
}

function getPublishedDate(filePath: string) {
  const contentFolder = path.resolve("./content");
  const relativePath = filePath.replace(contentFolder, "").replace(/^\/+/, "");
  // Remove the first level folder (blogs or pages) from the path
  const pathWithoutFirstLevel = relativePath.replace(/^[^\/]+\//, "");
  const dateMatch = pathWithoutFirstLevel.match(/^(\d{4}-\d{2}-\d{2})\//);
  if (!dateMatch || !dateMatch[1]) {
    throw new Error(
      `Invalid date format in path: ${filePath}. Expected pattern: /content/[blogs|pages]/YYYY-MM-DD/...`,
    );
  }
  const dateString = dateMatch[1];
  const publishedDate = new Date(dateString);
  if (isNaN(publishedDate.getTime())) {
    throw new Error(`Invalid date: ${dateString} in path: ${filePath}`);
  }
  return publishedDate;
}
