export function initMermaidTheme() {
  function update() {
    const isDark = document.documentElement.dataset.colorScheme === "dark"
    document.querySelectorAll<HTMLImageElement>(".mermaid-diagram").forEach((img) => {
      const src = isDark ? img.dataset.srcDark : img.dataset.srcLight
      if (src && img.src !== new URL(src, location.origin).href) {
        img.src = src
      }
    })
  }

  update()

  new MutationObserver(() => update()).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-color-scheme"],
  })
}
