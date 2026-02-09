type SiteTheme = "auto" | "light" | "dark" | "high-contrast-light" | "high-contrast-dark" | "paper"

interface ThemeConfig {
  THEMES: SiteTheme[]
  STORAGE_KEY: string
  THEME_LABELS: Record<SiteTheme, string>
}

interface Window {
  applySiteTheme(theme?: SiteTheme): void
  getNextTheme(): SiteTheme
  __themeConfig: ThemeConfig
}
