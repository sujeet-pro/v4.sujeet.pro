const THEMES: SiteTheme[] = ["auto", "light", "dark", "high-contrast-light", "high-contrast-dark", "paper"]
const STORAGE_KEY = "site-theme"

const THEME_LABELS: Record<SiteTheme, string> = {
  auto: "Auto (system)",
  light: "Light",
  dark: "Dark",
  "high-contrast-light": "High contrast light",
  "high-contrast-dark": "High contrast dark",
  paper: "Paper",
}

function getCurrentTheme(): SiteTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SiteTheme | null
    if (saved && THEMES.includes(saved)) return saved
  } catch {
    // localStorage unavailable
  }
  return "auto"
}

function updateButton(btn: HTMLElement, theme: SiteTheme) {
  btn.setAttribute("aria-label", `Theme: ${THEME_LABELS[theme]}. Click to cycle.`)
  btn.dataset.theme = theme

  // Show only the active icon
  const icons = btn.querySelectorAll<HTMLElement>("[data-theme-icon]")
  icons.forEach((icon) => {
    icon.style.display = icon.dataset.themeIcon === theme ? "block" : "none"
  })
}

export function initThemeToggle() {
  const btn = document.getElementById("theme-toggle-btn")
  if (!btn) return
  // Prevent double-init
  if (btn.dataset.themeInit) return
  btn.dataset.themeInit = "true"

  // Set initial state
  updateButton(btn, getCurrentTheme())

  btn.addEventListener("click", () => {
    const current = getCurrentTheme()
    const idx = THEMES.indexOf(current)
    const next = THEMES[(idx + 1) % THEMES.length]
    window.applySiteTheme(next)
    updateButton(btn, next)
  })

  // Listen for external theme changes (e.g. from another tab)
  const observer = new MutationObserver(() => {
    const theme = (document.documentElement.dataset.theme as SiteTheme) || "auto"
    updateButton(btn, theme)
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  })
}
