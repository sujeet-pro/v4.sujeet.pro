/**
 * Search keyboard shortcuts
 * - Header search Enter → navigate to search page
 * - Cmd+K / Ctrl+K → focus search or navigate to search page
 */

function initSearchKeyboardHandlers() {
  const headerSearchInput = document.querySelector<HTMLInputElement>("input#search-input")

  // Header search input: Enter key navigates to search page
  headerSearchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const query = headerSearchInput.value.trim()
      const searchUrl = new URL("/search", window.location.origin)
      if (query) {
        searchUrl.searchParams.set("q", query)
      }
      window.location.href = searchUrl.pathname + searchUrl.search
    }
  })
}

function initGlobalKeyboardShortcuts() {
  // cmd+k / ctrl+k: Focus appropriate search input or navigate to search page
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault()

      // First check for search page input (takes priority when on search page)
      const searchPageInput = document.querySelector<HTMLInputElement>("input#search-query")
      if (searchPageInput && searchPageInput.offsetParent !== null) {
        searchPageInput.focus()
        return
      }

      // Then check for header search input
      const headerSearchInput = document.querySelector<HTMLInputElement>("input#search-input")
      if (headerSearchInput && headerSearchInput.offsetParent !== null) {
        headerSearchInput.focus()
        return
      }

      // Otherwise navigate to search page
      window.location.href = "/search"
    }
  })
}

export function initSearchKeyboard() {
  initSearchKeyboardHandlers()
  initGlobalKeyboardShortcuts()
}

export { initGlobalKeyboardShortcuts, initSearchKeyboardHandlers }
