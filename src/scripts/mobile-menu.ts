import { lockScroll, unlockScroll } from "@/utils/scroll-lock"

export function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn")
  const closeBtn = document.getElementById("mobile-menu-close")
  const overlay = document.getElementById("mobile-menu-overlay")
  const menu = document.getElementById("mobile-menu")

  function openMenu() {
    menu?.classList.add("is-open")
    overlay?.classList.remove("is-hidden")
    menuBtn?.setAttribute("aria-expanded", "true")
    menu?.setAttribute("aria-hidden", "false")
    lockScroll()
  }

  function closeMenu() {
    menu?.classList.remove("is-open")
    overlay?.classList.add("is-hidden")
    menuBtn?.setAttribute("aria-expanded", "false")
    menu?.setAttribute("aria-hidden", "true")
    unlockScroll()
  }

  menuBtn?.addEventListener("click", openMenu)
  closeBtn?.addEventListener("click", closeMenu)
  overlay?.addEventListener("click", closeMenu)

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu?.classList.contains("is-open")) {
      closeMenu()
    }
  })

  menu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu)
  })
}
