import { lockScroll, resetScrollLock, unlockScroll } from "@/utils/scroll-lock"

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
  const leftClose = document.querySelector<HTMLButtonElement>('[data-sidebar-close="left"]')
  const rightClose = document.querySelector<HTMLButtonElement>('[data-sidebar-close="right"]')

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
      updateLeftToggleTitle(false)
    }
    if (rightState === "collapsed" && rightSidebar) {
      rightSidebar.classList.add("is-collapsed")
      rightToggle?.setAttribute("aria-expanded", "false")
      updateRightToggleTitle(false)
    }
  }

  function closeMobileSidebars() {
    const wasOpen = leftSidebar?.classList.contains("is-open") || rightSidebar?.classList.contains("is-open")
    leftSidebar?.classList.remove("is-open")
    rightSidebar?.classList.remove("is-open")
    backdrop?.classList.remove("is-visible")
    if (wasOpen) unlockScroll()
  }

  function updateLeftToggleTitle(expanded: boolean) {
    if (leftToggle) {
      leftToggle.title = expanded ? "Hide navigation sidebar" : "Show navigation sidebar"
    }
  }

  function updateRightToggleTitle(expanded: boolean) {
    if (rightToggle) {
      rightToggle.title = expanded ? "Hide table of contents" : "Show table of contents"
    }
  }

  function toggleLeftSidebar() {
    if (!leftSidebar) return

    if (isDesktop()) {
      leftSidebar.classList.toggle("is-collapsed")
      const isCollapsed = leftSidebar.classList.contains("is-collapsed")
      localStorage.setItem("zen-sidebar-left", isCollapsed ? "collapsed" : "open")
      leftToggle?.setAttribute("aria-expanded", String(!isCollapsed))
      updateLeftToggleTitle(!isCollapsed)
    } else {
      const isOpen = leftSidebar.classList.contains("is-open")
      if (isOpen) {
        closeMobileSidebars()
      } else {
        rightSidebar?.classList.remove("is-open")
        leftSidebar.classList.add("is-open")
        backdrop?.classList.add("is-visible")
        lockScroll()
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
      updateRightToggleTitle(!isCollapsed)
    } else {
      const isOpen = rightSidebar.classList.contains("is-open")
      if (isOpen) {
        closeMobileSidebars()
      } else {
        leftSidebar?.classList.remove("is-open")
        rightSidebar.classList.add("is-open")
        backdrop?.classList.add("is-visible")
        lockScroll()
      }
    }
  }

  leftToggle?.addEventListener("click", toggleLeftSidebar)
  rightToggle?.addEventListener("click", toggleRightSidebar)
  backdrop?.addEventListener("click", closeMobileSidebars)
  leftClose?.addEventListener("click", closeMobileSidebars)
  rightClose?.addEventListener("click", closeMobileSidebars)

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
      leftSidebar?.classList.remove("is-open")
      rightSidebar?.classList.remove("is-open")
      backdrop?.classList.remove("is-visible")
      resetScrollLock()

      const leftState = localStorage.getItem("zen-sidebar-left")
      const rightState = localStorage.getItem("zen-sidebar-right")
      if (leftState === "collapsed" && leftSidebar) {
        leftSidebar.classList.add("is-collapsed")
        leftToggle?.setAttribute("aria-expanded", "false")
        updateLeftToggleTitle(false)
      }
      if (rightState === "collapsed" && rightSidebar) {
        rightSidebar.classList.add("is-collapsed")
        rightToggle?.setAttribute("aria-expanded", "false")
        updateRightToggleTitle(false)
      }
    } else {
      // Crossed into mobile: remove desktop collapsed state
      leftSidebar?.classList.remove("is-collapsed")
      rightSidebar?.classList.remove("is-collapsed")
      leftToggle?.setAttribute("aria-expanded", "true")
      rightToggle?.setAttribute("aria-expanded", "true")
      updateLeftToggleTitle(true)
      updateRightToggleTitle(true)
    }
  })
}
