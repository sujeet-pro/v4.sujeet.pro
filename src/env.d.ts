type SiteTheme = "auto" | "light" | "dark" | "high-contrast-light" | "high-contrast-dark" | "paper"

interface Window {
  applySiteTheme(theme?: SiteTheme): void
}
