function updateButton(btn: HTMLElement, theme: SiteTheme) {
  const labels = window.__themeConfig.THEME_LABELS
  const nextTheme = window.getNextTheme()
  btn.setAttribute("aria-label", `Theme: ${labels[theme]}. Click to cycle.`)
  btn.title = `Switch to ${labels[nextTheme]}`
  btn.dataset.theme = theme

  // Show only the active icon
  const icons = btn.querySelectorAll<HTMLElement>("[data-theme-icon]")
  icons.forEach((icon) => {
    icon.style.display = icon.dataset.themeIcon === theme ? "block" : "none"
  })
}

function updateSelect(select: HTMLSelectElement, theme: SiteTheme) {
  if (select.value !== theme) {
    select.value = theme
  }
}

function initButtonHandler(btn: HTMLElement) {
  if (btn.dataset.themeInit) return
  btn.dataset.themeInit = "true"

  btn.addEventListener("click", () => {
    const next = window.getNextTheme()
    window.applySiteTheme(next)
  })
}

function initSelectHandler(select: HTMLSelectElement) {
  if (select.dataset.themeInit) return
  select.dataset.themeInit = "true"

  select.addEventListener("change", () => {
    const theme = select.value as SiteTheme
    const themes = window.__themeConfig.THEMES
    if (themes.includes(theme)) {
      window.applySiteTheme(theme)
    }
  })
}

function initThemeObserver() {
  const root = document.documentElement
  // Guard: one observer per page lifecycle (survives View Transitions)
  if (root.dataset.themeObserverInit) return
  root.dataset.themeObserverInit = "true"

  const observer = new MutationObserver(() => {
    const theme = (root.dataset.theme as SiteTheme) || "auto"
    // Re-query each time to avoid stale refs after View Transitions
    const btn = document.getElementById("theme-toggle-btn")
    if (btn) updateButton(btn, theme)
    const select = document.getElementById("theme-select") as HTMLSelectElement | null
    if (select) updateSelect(select, theme)
  })
  observer.observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  })
}

export function initThemeToggle() {
  const currentTheme = (document.documentElement.dataset.theme as SiteTheme) || "auto"

  // Header button
  const btn = document.getElementById("theme-toggle-btn")
  if (btn) {
    updateButton(btn, currentTheme)
    initButtonHandler(btn)
  }

  // Footer select
  const select = document.getElementById("theme-select") as HTMLSelectElement | null
  if (select) {
    updateSelect(select, currentTheme)
    initSelectHandler(select)
  }

  // Single observer for all UI updates
  initThemeObserver()
}
