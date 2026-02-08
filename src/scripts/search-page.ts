/**
 * Search page client-side logic
 * - Loads Orama search index
 * - Handles search queries, filters, URL syncing
 * - Renders results with facet counts
 */

import { create, load, search } from "@orama/orama"

// Load shared constants from server-rendered JSON
const searchSchema = JSON.parse(document.getElementById("search-schema-data")?.textContent ?? "{}")

interface SearchParams {
  q: string
  categories: string[]
  topics: string[]
}

let db: Awaited<ReturnType<typeof create<typeof searchSchema>>> | null = null

// Use DOM marker to track initialization (survives script re-execution)
const INIT_MARKER = "data-search-initialized"

// Get search index path from server-rendered data
const searchIndexPath = JSON.parse(
  document.getElementById("search-index-path")?.textContent ?? '"/search/index.json"',
)

// Load search index
async function loadIndex() {
  if (db) return
  try {
    const response = await fetch(searchIndexPath)
    const data = await response.json()
    db = create({ schema: searchSchema })
    load(db, data)
  } catch (e) {
    console.error("Failed to load search index:", e)
  }
}

// Parse URL params
function getUrlParams(): SearchParams {
  const params = new URLSearchParams(window.location.search)
  return {
    q: params.get("q") || "",
    categories: params.get("categories")?.split(",").filter(Boolean) || [],
    topics: params.get("topics")?.split(",").filter(Boolean) || [],
  }
}

// Update URL and trigger search via replaceState
function updateUrl(params: SearchParams) {
  const url = new URL(window.location.href)

  if (params.q) url.searchParams.set("q", params.q)
  else url.searchParams.delete("q")

  if (params.categories.length) url.searchParams.set("categories", params.categories.join(","))
  else url.searchParams.delete("categories")

  if (params.topics.length) url.searchParams.set("topics", params.topics.join(","))
  else url.searchParams.delete("topics")

  // Use replaceState to update URL without adding to history
  window.history.replaceState({}, "", url.toString())
  // Trigger search with new params
  handleUrlChange()
}

// Toggle a value in an array (add if not present, remove if present)
function toggleArrayValue(arr: string[], value: string): string[] {
  const index = arr.indexOf(value)
  if (index === -1) {
    return [...arr, value]
  } else {
    return arr.filter((v) => v !== value)
  }
}

// Check if any filters (categories/topics) are active
function hasFiltersActive(params: SearchParams) {
  return params.categories.length > 0 || params.topics.length > 0
}

// Sync UI with current URL params
function syncUIWithParams(params: SearchParams) {
  const queryInput = document.getElementById("search-query") as HTMLInputElement
  const hintEl = document.getElementById("search-hint") as HTMLElement
  const clearBtn = document.getElementById("clear-filters") as HTMLButtonElement
  const activeFiltersDisplay = document.getElementById("active-filters-display") as HTMLElement
  if (!queryInput) return

  queryInput.value = params.q

  // Sync category checkboxes
  document.querySelectorAll<HTMLInputElement>('#search-filters input[name="category"]').forEach((cb) => {
    cb.checked = params.categories.includes(cb.value)
  })

  // Sync topic checkboxes
  document.querySelectorAll<HTMLInputElement>('#search-filters input[name="topic"]').forEach((cb) => {
    cb.checked = params.topics.includes(cb.value)
  })

  // Show/hide hint based on query
  if (params.q) {
    hintEl?.classList.add("is-hidden")
  } else {
    hintEl?.classList.remove("is-hidden")
  }

  // Update active filters display (pills in header) and clear button
  if (hasFiltersActive(params)) {
    clearBtn?.classList.remove("is-hidden")

    // Build active filter pills HTML
    if (activeFiltersDisplay) {
      const pills: string[] = []

      // Get category names (just the name, not the count)
      params.categories.forEach((catId) => {
        const label = document.querySelector(`#category-filters [data-filter-id="${catId}"]`)
        const nameEl = label?.querySelector(".filter-chip-pill")
        // Get just the text before the count span
        const name = nameEl?.childNodes[0]?.textContent?.trim()
        if (name) {
          pills.push(`<span class="active-pill" data-type="category" data-value="${catId}">${name}</span>`)
        }
      })

      // Get topic names (just the name, not the count)
      params.topics.forEach((topicId) => {
        const label = document.querySelector(`#topic-filters [data-filter-id="${topicId}"]`)
        const nameEl = label?.querySelector(".filter-chip-pill")
        // Get just the text before the count span
        const name = nameEl?.childNodes[0]?.textContent?.trim()
        if (name) {
          pills.push(`<span class="active-pill" data-type="topic" data-value="${topicId}">${name}</span>`)
        }
      })

      activeFiltersDisplay.innerHTML = pills.join("")
    }
  } else {
    clearBtn?.classList.add("is-hidden")
    if (activeFiltersDisplay) {
      activeFiltersDisplay.innerHTML = ""
    }
  }
}

// Render a single result item HTML
function renderResultItem(hit: any, index: number): string {
  const doc = hit.document
  const href = doc.href || ""
  const title = doc.title || "Untitled"
  const description = doc.description || ""
  const categoryId = doc.category || ""
  const categoryName = doc.categoryName || ""
  const topicId = doc.topic || ""
  const topicName = doc.topicName || ""
  const minutesRead = doc.minutesRead || ""

  // Stagger animation delay
  const delay = Math.min(index * 50, 400)

  return `
    <li class="search-result-card" style="animation-delay: ${delay}ms">
      <article class="result-card-inner">
        <h3 class="result-card-title">
          <a href="${href}" class="result-card-link">${title}</a>
        </h3>
        <div class="result-card-meta">
          ${categoryName ? `<button type="button" class="result-meta-btn" data-filter-type="category" data-filter-value="${categoryId}">${categoryName}</button>` : ""}
          ${topicName ? `<span class="result-meta-sep">/</span><button type="button" class="result-meta-btn" data-filter-type="topic" data-filter-value="${topicId}">${topicName}</button>` : ""}
          ${
            minutesRead
              ? `<span class="result-meta-time">
              <svg xmlns="http://www.w3.org/2000/svg" class="result-meta-icon" viewBox="0 0 32 32"><path fill="currentColor" d="M16 30a14 14 0 1 1 14-14a14 14 0 0 1-14 14m0-26a12 12 0 1 0 12 12A12 12 0 0 0 16 4"/><path fill="currentColor" d="M20.59 22L15 16.41V7h2v8.58l5 5.01z"/></svg>
              <span>${minutesRead}</span>
            </span>`
              : ""
          }
        </div>
        <p class="result-card-excerpt">${description}</p>
      </article>
    </li>
  `
}

// Calculate facet counts from a set of hits
function calculateFacetCounts(hits: any[]): { categories: Map<string, number>; topics: Map<string, number> } {
  const categories = new Map<string, number>()
  const topics = new Map<string, number>()

  for (const hit of hits) {
    const category = hit.document.category || ""
    const topic = hit.document.topic || ""

    if (category) {
      categories.set(category, (categories.get(category) || 0) + 1)
    }
    if (topic) {
      topics.set(topic, (topics.get(topic) || 0) + 1)
    }
  }

  return { categories, topics }
}

// Update facet counts
function updateFacetCounts(counts: { categories: Map<string, number>; topics: Map<string, number> }) {
  // Update category counts
  document.querySelectorAll("#category-filters [data-count-for]").forEach((el) => {
    const id = el.getAttribute("data-count-for")
    if (id) {
      const count = counts.categories.get(id) || 0
      el.textContent = `${count}`
      // Dim the label if count is 0
      const label = el.closest(".filter-chip")
      if (label) {
        label.classList.toggle("filter-chip--empty", count === 0)
      }
    }
  })

  // Update topic counts
  document.querySelectorAll("#topic-filters [data-count-for]").forEach((el) => {
    const id = el.getAttribute("data-count-for")
    if (id) {
      const count = counts.topics.get(id) || 0
      el.textContent = `${count}`
      // Dim the label if count is 0
      const label = el.closest(".filter-chip")
      if (label) {
        label.classList.toggle("filter-chip--empty", count === 0)
      }
    }
  })
}

// Execute search
async function executeSearch(params: SearchParams) {
  await loadIndex()
  if (!db) {
    console.error("Search index not loaded")
    return
  }

  const resultsEl = document.getElementById("search-results") as HTMLUListElement
  const countEl = document.getElementById("result-count") as HTMLParagraphElement

  if (!resultsEl) return

  // Step 1: Execute search query (empty term returns all documents)
  const results = await search(db, {
    term: params.q || "",
    limit: 1000,
  })

  // Step 2: Get query-filtered results (before category/topic filters)
  const queryFilteredHits = results.hits as any[]

  // Step 3: Apply category/topic filters on top of query results
  let finalHits = queryFilteredHits

  // Category filter (OR logic - match any selected category)
  if (params.categories.length > 0) {
    finalHits = finalHits.filter((hit) => {
      const category = hit.document.category || ""
      return params.categories.includes(category)
    })
  }

  // Topic filter (OR logic - match any selected topic)
  if (params.topics.length > 0) {
    finalHits = finalHits.filter((hit) => {
      const topic = hit.document.topic || ""
      return params.topics.includes(topic)
    })
  }

  // Step 4: Calculate facet counts from final results (current displayed set)
  const facetCounts = calculateFacetCounts(finalHits)
  updateFacetCounts(facetCounts)

  // Handle no results
  if (finalHits.length === 0) {
    resultsEl.innerHTML = `
      <li class="search-empty-state">
        <div class="search-empty-content">
          <div class="search-empty-icon-wrapper search-empty-icon-wrapper--muted">
            <svg xmlns="http://www.w3.org/2000/svg" class="search-empty-icon" viewBox="0 0 32 32"><path fill="currentColor" d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2m0 26a12 12 0 1 1 12-12a12 12 0 0 1-12 12"/><path fill="currentColor" d="M11.5 11a2.5 2.5 0 1 0 2.5 2.5a2.5 2.5 0 0 0-2.5-2.5m9 0a2.5 2.5 0 1 0 2.5 2.5a2.5 2.5 0 0 0-2.5-2.5M16 19a8 8 0 0 0-6.85 3.89l1.71 1a6 6 0 0 1 10.28 0l1.71-1A8 8 0 0 0 16 19"/></svg>
          </div>
          <p class="search-empty-text">No matching articles found</p>
          <p class="search-empty-hint">Try different search terms or filters</p>
        </div>
      </li>
    `
    countEl?.classList.add("is-hidden")
    return
  }

  // Show result count
  if (countEl) {
    const countText = finalHits.length === 1 ? "1 article found" : `${finalHits.length} articles found`
    countEl.textContent = countText
    countEl.classList.remove("is-hidden")
  }

  // Render all results
  resultsEl.innerHTML = finalHits.map((hit, index) => renderResultItem(hit, index)).join("")
}

// Handle URL change (the single source of truth for search)
async function handleUrlChange() {
  const params = getUrlParams()
  syncUIWithParams(params)
  await executeSearch(params)
}

// Main initialization function
export async function initSearchPage() {
  // Guard: only run on search page
  const queryInput = document.getElementById("search-query") as HTMLInputElement
  if (!queryInput) return

  // Guard: prevent double initialization using DOM marker
  if (queryInput.hasAttribute(INIT_MARKER)) return
  queryInput.setAttribute(INIT_MARKER, "true")

  const clearBtn = document.getElementById("clear-filters") as HTMLButtonElement
  const resultsEl = document.getElementById("search-results")
  const filtersEl = document.getElementById("search-filters")

  // Listen for URL changes (back/forward navigation)
  window.addEventListener("popstate", handleUrlChange)

  // Handle filter button clicks in search results (event delegation)
  resultsEl?.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement
    if (!target) return

    const filterBtn = target.closest(".result-meta-btn") as HTMLButtonElement | null
    if (!filterBtn) return

    e.preventDefault()
    e.stopPropagation()

    const filterType = filterBtn.getAttribute("data-filter-type")
    const filterValue = filterBtn.getAttribute("data-filter-value")
    if (!filterType || !filterValue) return

    const params = getUrlParams()

    if (filterType === "category") {
      params.categories = toggleArrayValue(params.categories, filterValue)
    } else if (filterType === "topic") {
      params.topics = toggleArrayValue(params.topics, filterValue)
    }

    updateUrl(params)
  })

  // Handle filter changes (event delegation)
  filtersEl?.addEventListener("change", (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target || target.type !== "checkbox") return

    const filterName = target.name
    const filterValue = target.value
    const params = getUrlParams()

    if (filterName === "category") {
      params.categories = toggleArrayValue(params.categories, filterValue)
    } else if (filterName === "topic") {
      params.topics = toggleArrayValue(params.topics, filterValue)
    }

    updateUrl(params)
  })

  // Query input: update URL on Enter
  queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const params = getUrlParams()
      params.q = queryInput.value.trim()
      updateUrl(params)
    }
  })

  // Clear all filters (keep query): reset filters only
  clearBtn?.addEventListener("click", () => {
    const params = getUrlParams()
    updateUrl({ q: params.q, categories: [], topics: [] })
  })

  // Focus input on load
  queryInput.focus()

  // Initial sync and search based on current URL
  await handleUrlChange()
}
