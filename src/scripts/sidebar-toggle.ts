const SIDEBAR_BREAKPOINT = "(min-width: 1440px)"

export function initSidebarToggle() {
  const leftSidebar = document.getElementById("left-sidebar")
  // Skip if already initialized for this DOM state (prevents double-init)
  if (leftSidebar?.dataset.sidebarInit) return
  if (leftSidebar) leftSidebar.dataset.sidebarInit = "true"

  const rightSidebar = document.getElementById("right-sidebar")
  const leftToggle = document.getElementById("left-sidebar-toggle")
  const rightToggle = document.getElementById("right-sidebar-toggle")
  const backdrop = document.getElementById("sidebar-backdrop")

  const desktopQuery = window.matchMedia(SIDEBAR_BREAKPOINT)

  function isDesktop() {
    return desktopQuery.matches
  }

  // Restore desktop sidebar state from localStorage
  if (isDesktop()) {
    const leftState = localStorage.getItem("zen-sidebar-left")
    const rightState = localStorage.getItem("zen-sidebar-right")

    if (leftState === "collapsed" && leftSidebar) {
      leftSidebar.classList.add("is-collapsed")
      leftToggle?.setAttribute("aria-expanded", "false")
    }
    if (rightState === "collapsed" && rightSidebar) {
      rightSidebar.classList.add("is-collapsed")
      rightToggle?.setAttribute("aria-expanded", "false")
    }
  }

  function closeMobileSidebars() {
    leftSidebar?.classList.remove("is-open")
    rightSidebar?.classList.remove("is-open")
    backdrop?.classList.remove("is-visible")
    document.body.style.overflow = ""
  }

  function toggleLeftSidebar() {
    if (!leftSidebar) return

    if (isDesktop()) {
      leftSidebar.classList.toggle("is-collapsed")
      const isCollapsed = leftSidebar.classList.contains("is-collapsed")
      localStorage.setItem("zen-sidebar-left", isCollapsed ? "collapsed" : "open")
      leftToggle?.setAttribute("aria-expanded", String(!isCollapsed))
    } else {
      const isOpen = leftSidebar.classList.contains("is-open")
      if (isOpen) {
        closeMobileSidebars()
      } else {
        rightSidebar?.classList.remove("is-open")
        leftSidebar.classList.add("is-open")
        backdrop?.classList.add("is-visible")
        document.body.style.overflow = "hidden"
      }
    }
  }

  function toggleRightSidebar() {
    if (!rightSidebar) return

    if (isDesktop()) {
      rightSidebar.classList.toggle("is-collapsed")
      const isCollapsed = rightSidebar.classList.contains("is-collapsed")
      localStorage.setItem("zen-sidebar-right", isCollapsed ? "collapsed" : "open")
      rightToggle?.setAttribute("aria-expanded", String(!isCollapsed))
    } else {
      const isOpen = rightSidebar.classList.contains("is-open")
      if (isOpen) {
        closeMobileSidebars()
      } else {
        leftSidebar?.classList.remove("is-open")
        rightSidebar.classList.add("is-open")
        backdrop?.classList.add("is-visible")
        document.body.style.overflow = "hidden"
      }
    }
  }

  leftToggle?.addEventListener("click", toggleLeftSidebar)
  rightToggle?.addEventListener("click", toggleRightSidebar)
  backdrop?.addEventListener("click", closeMobileSidebars)

  // Escape key closes mobile sidebars
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileSidebars()
    }
  })

  // React to breakpoint changes via matchMedia
  desktopQuery.addEventListener("change", (e) => {
    if (e.matches) {
      // Crossed into desktop: close any open mobile sidebars,
      // then restore desktop collapsed state from localStorage
      closeMobileSidebars()

      const leftState = localStorage.getItem("zen-sidebar-left")
      const rightState = localStorage.getItem("zen-sidebar-right")
      if (leftState === "collapsed" && leftSidebar) {
        leftSidebar.classList.add("is-collapsed")
        leftToggle?.setAttribute("aria-expanded", "false")
      }
      if (rightState === "collapsed" && rightSidebar) {
        rightSidebar.classList.add("is-collapsed")
        rightToggle?.setAttribute("aria-expanded", "false")
      }
    } else {
      // Crossed into mobile: remove desktop collapsed state
      leftSidebar?.classList.remove("is-collapsed")
      rightSidebar?.classList.remove("is-collapsed")
      leftToggle?.setAttribute("aria-expanded", "true")
      rightToggle?.setAttribute("aria-expanded", "true")
    }
  })
}
