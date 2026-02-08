export function initReadingProgress() {
  const progressBar = document.getElementById("reading-progress")
  if (!progressBar) return

  // Find the article content
  const article = document.querySelector("article") || document.querySelector(".prose")
  if (!article) {
    progressBar.style.display = "none"
    return
  }

  function updateProgress() {
    if (!article || !progressBar) return

    const articleRect = article.getBoundingClientRect()
    const articleTop = articleRect.top + window.scrollY
    const articleHeight = articleRect.height
    const windowHeight = window.innerHeight
    const scrollY = window.scrollY

    // Calculate how far through the article we've scrolled
    const start = articleTop - windowHeight / 2
    const end = articleTop + articleHeight - windowHeight / 2
    const current = scrollY

    let progress = 0
    if (current > start) {
      progress = Math.min(100, ((current - start) / (end - start)) * 100)
    }

    progressBar.style.width = `${Math.max(0, progress)}%`
  }

  // Update on scroll with throttling
  let ticking = false
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress()
        ticking = false
      })
      ticking = true
    }
  })

  // Initial update
  updateProgress()
}
