import { base, trailingSlash as trailingSlashConfig } from "astro:config/client"

export function getLinkProps({
  href,
  trailingSlash = trailingSlashConfig,
  target,
  rel,
}: {
  href: string
  trailingSlash?: "always" | "never" | "ignore"
  target?: string | null | undefined
  rel?: string | null | undefined
}) {
  if (!href || typeof href !== "string") {
    return { href, target, rel }
  }
  if (href.startsWith("https://")) {
    return {
      href: href,
      target: target ?? "_blank",
      rel: rel ?? "noopener noreferrer",
    }
  }

  if (href === "/") {
    href = "/" + base.replace(/^\//, "")
  } else {
    const basePart = replaceLeadingAndTrailingSlashes(base)
    if (basePart) {
      href = "/" + basePart + "/" + href.replace(/^\//, "")
    } else {
      href = "/" + href.replace(/^\//, "")
    }
  }

  if (trailingSlash === "always" && !href.endsWith("/") && href !== "/") {
    href = href + "/"
  } else if (trailingSlash === "never" && href.endsWith("/") && href !== "/") {
    href = href.replace(/\/$/, "")
  }

  return {
    href,
    target,
    rel,
  }
}

export function getFilePath(...pathFragments: string[]) {
  const path = pathFragments.map(replaceLeadingAndTrailingSlashes).join("/")
  return getLinkProps({
    href: "/" + path,
    trailingSlash: "never",
  }).href
}

export function getFaviconPath(filename: string) {
  return getFilePath("favicons", filename)
}

function replaceLeadingAndTrailingSlashes(str: string) {
  return str.replace(/^\//, "").replace(/\/$/, "")
}
