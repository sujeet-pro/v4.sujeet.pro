/**
 * Shared scroll-lock utility.
 *
 * Reference-counted so nested overlays (sidebar + DocSearch) don't conflict.
 * Uses position:fixed technique to prevent iOS bounce-scroll bleed-through.
 */

let lockCount = 0
let savedScrollY = 0

export function lockScroll(): void {
  lockCount++
  if (lockCount === 1) {
    savedScrollY = window.scrollY
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.width = "100%"
    document.body.style.top = `-${savedScrollY}px`
  }
}

export function unlockScroll(): void {
  if (lockCount <= 0) return
  lockCount--
  if (lockCount === 0) {
    document.body.style.overflow = ""
    document.body.style.position = ""
    document.body.style.width = ""
    document.body.style.top = ""
    window.scrollTo(0, savedScrollY)
  }
}

/** Force-clear without scroll restore (for breakpoint changes). */
export function resetScrollLock(): void {
  lockCount = 0
  document.body.style.overflow = ""
  document.body.style.position = ""
  document.body.style.width = ""
  document.body.style.top = ""
}
