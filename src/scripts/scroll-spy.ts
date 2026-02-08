export function initScrollSpy() {
  const main = document.getElementById("main")
  if (!main) return

  const headings = Array.from(main.querySelectorAll<HTMLElement>("h2[id], h3[id]"))
  if (headings.length === 0) return

  const tocLinks = document.querySelectorAll<HTMLAnchorElement>("#right-sidebar .sidebar-toc-item")
  if (tocLinks.length === 0) return

  // Build a map from heading id to TOC link
  const tocMap = new Map<string, HTMLAnchorElement>()
  tocLinks.forEach((link) => {
    const hash = link.getAttribute("href")
    if (hash?.startsWith("#")) {
      tocMap.set(hash.slice(1), link)
    }
  })

  let activeLink: HTMLAnchorElement | null = null
  const intersecting = new Set<string>()

  function setActive(id: string) {
    const link = tocMap.get(id)
    if (!link || link === activeLink) return

    activeLink?.classList.remove("is-active")
    link.classList.add("is-active")
    activeLink = link

    // Auto-scroll active TOC item into view within the sidebar
    link.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).id
        if (entry.isIntersecting) {
          intersecting.add(id)
        } else {
          intersecting.delete(id)
        }
      })

      // Find the topmost currently-intersecting heading (by DOM order)
      if (intersecting.size > 0) {
        for (const heading of headings) {
          if (intersecting.has(heading.id)) {
            setActive(heading.id)
            break
          }
        }
      }
      // If nothing is intersecting, keep the last active one
    },
    {
      rootMargin: "-80px 0px -75% 0px",
    },
  )

  headings.forEach((h) => observer.observe(h))

  // Clean up on view transition swap
  document.addEventListener(
    "astro:before-swap",
    () => {
      observer.disconnect()
    },
    { once: true },
  )
}
