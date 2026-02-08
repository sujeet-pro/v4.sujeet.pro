interface TocItem {
  id: string
  text: string
  level: number
}

interface TocSection {
  h2: TocItem
  h3s: TocItem[]
}

export function initTocDialog() {
  // Find all h2 and h3 headings in the article
  const article = document.querySelector("article")
  if (!article) return

  const headings = article.querySelectorAll("h2, h3")
  if (headings.length === 0) return

  // Build TOC items (only h2 and h3)
  const tocItems: TocItem[] = Array.from(headings).map((heading) => {
    const id = heading.id
    const text = heading.textContent?.trim() || ""
    const level = parseInt(heading.tagName[1] ?? "2")
    return { id, text, level }
  })

  // Group h3s under their parent h2
  const sections: TocSection[] = []
  let currentSection: TocSection | null = null

  tocItems.forEach((item) => {
    if (item.level === 2) {
      currentSection = { h2: item, h3s: [] }
      sections.push(currentSection)
    } else if (item.level === 3 && currentSection) {
      currentSection.h3s.push(item)
    }
  })

  // Calculate total TOC items to determine if we should expand all
  const totalItems = sections.reduce((count, section) => count + 1 + section.h3s.length, 0)
  const expandAllThreshold = 15
  const shouldExpandAll = totalItems <= expandAllThreshold

  // Generate HTML with collapsible sections
  function generateTocHtml(sections: TocSection[]): string {
    return `<ul class="toc-list">${sections
      .map((section) => {
        const hasChildren = section.h3s.length > 0

        if (hasChildren) {
          const h3Items = section.h3s
            .map(
              (h3) => `
                <li>
                  <a href="#${h3.id}" class="toc-link toc-link-h3">
                    ${h3.text}
                  </a>
                </li>
              `,
            )
            .join("")

          const openAttr = shouldExpandAll ? "open" : ""

          return `
              <li class="toc-section">
                <details class="toc-details" ${openAttr}>
                  <summary class="toc-summary">
                    <a href="#${section.h2.id}" class="toc-link toc-link-h2" data-h2-id="${section.h2.id}">
                      ${section.h2.text}
                    </a>
                    <svg class="toc-chevron" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </summary>
                  <ul class="toc-sublist">
                    ${h3Items}
                  </ul>
                </details>
              </li>
            `
        } else {
          return `
              <li class="toc-section">
                <a href="#${section.h2.id}" class="toc-link toc-link-h2" data-h2-id="${section.h2.id}">
                  ${section.h2.text}
                </a>
              </li>
            `
        }
      })
      .join("")}</ul>`
  }

  const tocHtml = generateTocHtml(sections)

  // Get elements
  const floatingBtn = document.getElementById("toc-floating-btn")
  const dialog = document.getElementById("toc-dialog") as HTMLDialogElement | null
  const dialogNav = dialog?.querySelector(".toc-dialog-nav")
  const closeBtn = document.getElementById("toc-dialog-close")

  // Move floating button to body so it's positioned correctly
  if (floatingBtn && floatingBtn.parentElement !== document.body) {
    document.body.appendChild(floatingBtn)
  }

  // Show floating button (JS is enabled and there's content)
  if (floatingBtn) {
    floatingBtn.classList.add("is-visible")
  }

  function setupLinkHandlers(container: HTMLElement | null) {
    if (!container) return

    container.querySelectorAll<HTMLAnchorElement>(".toc-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        const targetId = link.getAttribute("href")?.slice(1)
        if (targetId) {
          const target = document.getElementById(targetId)
          if (target) {
            // Close dialog first, then scroll
            closeDialog()
            // Small delay to allow dialog to close
            setTimeout(() => {
              target.scrollIntoView({ behavior: "smooth", block: "start" })
              history.pushState(null, "", `#${targetId}`)
            }, 100)
          }
        }
      })
    })
  }

  function openDialog() {
    if (!dialog || !dialogNav) return

    // Set TOC content
    dialogNav.innerHTML = tocHtml

    // Setup click handlers
    setupLinkHandlers(dialogNav as HTMLElement)

    // Show dialog as modal (traps focus and scroll)
    dialog.showModal()
  }

  function closeDialog() {
    if (!dialog) return
    dialog.close()
  }

  // Event listeners
  floatingBtn?.addEventListener("click", openDialog)
  closeBtn?.addEventListener("click", closeDialog)

  // Close on backdrop click
  dialog?.addEventListener("click", (e) => {
    if (e.target === dialog) {
      closeDialog()
    }
  })

  // Close on Escape is handled natively by dialog element
}
