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
    file.data.astro.frontmatter.slug ??= getSlug(file.path);
    // console.log(tree);
    // console.log(
    //   Object.fromEntries(Object.entries(file.data.astro.frontmatter).map(([key, value]) => [key, value.toString()])),
    // );
  };
};

function toTextString(tree: mdast.RootContent[]) {
  return toString(
    tree.filter((node) => node.type !== "code"),
    {
      includeHtml: false,
      includeImageAlt: false,
    },
  );
}

function getTitle(tree: mdast.Root, file: VFile) {
  const h1 = tree.children.find((child) => child.type === "heading" && child.depth === 1);

  if (!h1 && import.meta.env.DEV) {
    tree.children.unshift({
      type: "heading",
      depth: 1,
      children: [{ type: "text", value: "Draft: Add title" }],
    });
    return "Draft: Add title";
  }

  if (!h1) {
    throw new Error(`Missing h1 heading in ${file.path}`);
  }

  return toTextString([h1]);
}

function getDescription(tree: mdast.Root, file: VFile) {
  // get h1 index
  const h1Idx = tree.children.findIndex((child) => child.type === "heading" && child.depth === 1);
  if (h1Idx === -1 && !import.meta.env.DEV) {
    throw new Error(`Missing h1 heading in ${file.path}`);
  }
  // Ensure we have a table of contents, after h1
  const tableOfContentsIndex = tree.children.findIndex(
    (child, idx) =>
      idx > h1Idx && child.type === "heading" && child.depth === 2 && toString(child) === "Table of Contents",
  );
  if (tableOfContentsIndex === -1 && !import.meta.env.DEV) {
    throw new Error(`Missing "Table of Contents" heading in ${file.path}`);
  }

  const firstNonParaIndex = tree.children.findIndex((child, idx) => idx > h1Idx && child.type !== "paragraph");
  if (firstNonParaIndex === -1 && !import.meta.env.DEV) {
    throw new Error(`Missing non-paragraph content in ${file.path}`);
  } else if (firstNonParaIndex === -1 && import.meta.env.DEV) {
    return "Draft: Add description";
  }

  const endIdx = tableOfContentsIndex > h1Idx ? tableOfContentsIndex : firstNonParaIndex;

  // Setting description from text between h1 and "Table of Contents"
  const description = toTextString(tree.children.slice(h1Idx + 1, endIdx));
  if (!description) {
    if (import.meta.env.DEV) {
      return "Draft: Add description";
    }
    throw new Error(`Missing description in ${file.path}`);
  }
  return description;
}

function getPublishedDate(filePath: string) {
  const contentFolder = path.resolve("./content");
  const relativePath = filePath.replace(contentFolder, "").replace(/^\/+/, "");

  // Remove the first level folder (blogs or pages) from the path
  const pathWithoutFirstLevel = relativePath.replace(/^[^\/]+\//, "");

  // Check if date is in folder name (YYYY-MM-DD/)
  const folderDateMatch = pathWithoutFirstLevel.match(/^(\d{4}-\d{2}-\d{2})\//);
  if (folderDateMatch && folderDateMatch[1]) {
    const dateString = folderDateMatch[1];
    const publishedDate = new Date(dateString);
    if (isNaN(publishedDate.getTime())) {
      throw new Error(`Invalid date: ${dateString} in path: ${filePath}`);
    }
    return publishedDate;
  }

  // Check if date is in filename (YYYY-MM-DD-*)
  const filename = path.basename(filePath, path.extname(filePath));
  const filenameDateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (filenameDateMatch && filenameDateMatch[1]) {
    const dateString = filenameDateMatch[1];
    const publishedDate = new Date(dateString);
    if (isNaN(publishedDate.getTime())) {
      throw new Error(`Invalid date: ${dateString} in filename: ${filePath}`);
    }
    return publishedDate;
  }

  throw new Error(
    `Invalid date format in path: ${filePath}. Expected either folder pattern: /content/[blogs|pages]/YYYY-MM-DD/... or filename pattern: YYYY-MM-DD-*`,
  );
}

function getSlug(filePath: string) {
  const contentFolder = path.resolve("./content");
  const relativePath = filePath.replace(contentFolder, "").replace(/^\/+/, "");

  // Remove the first level folder (blogs or pages) from the path
  const pathWithoutFirstLevel = relativePath.replace(/^[^\/]+\//, "");

  // Check if date is in folder name (YYYY-MM-DD/)
  const folderDateMatch = pathWithoutFirstLevel.match(/^(\d{4}-\d{2}-\d{2})\//);
  if (folderDateMatch && folderDateMatch[1]) {
    // Remove the date folder and get the remaining path
    const slugPath = pathWithoutFirstLevel.replace(/^\d{4}-\d{2}-\d{2}\//, "");
    // Remove file extension
    return slugPath.replace(/\.[^/.]+$/, "");
  }

  // Check if date is in filename (YYYY-MM-DD-*)
  const filename = path.basename(filePath, path.extname(filePath));
  const filenameDateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (filenameDateMatch && filenameDateMatch[1]) {
    // Remove the date prefix from filename
    const slugFilename = filename.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    // Get the directory path without the filename
    const dirPath = path.dirname(pathWithoutFirstLevel);
    // Combine directory path with slug filename
    return dirPath ? `${dirPath}/${slugFilename}` : slugFilename;
  }

  throw new Error(
    `Invalid date format in path: ${filePath}. Expected either folder pattern: /content/[blogs|pages]/YYYY-MM-DD/... or filename pattern: YYYY-MM-DD-*`,
  );
}
