export function initAccordions() {
  const triggers = document.querySelectorAll<HTMLButtonElement>(".topic-accordion-trigger")

  triggers.forEach((trigger) => {
    // Remove existing listeners to prevent duplicates
    const newTrigger = trigger.cloneNode(true) as HTMLButtonElement
    trigger.parentNode?.replaceChild(newTrigger, trigger)

    newTrigger.addEventListener("click", (e) => {
      // Don't toggle if clicking a link inside the trigger
      if ((e.target as HTMLElement).closest("a")) {
        return
      }

      const expanded = newTrigger.getAttribute("aria-expanded") === "true"
      const contentId = newTrigger.getAttribute("aria-controls")
      const content = contentId ? document.getElementById(contentId) : null

      if (content) {
        newTrigger.setAttribute("aria-expanded", String(!expanded))
        content.hidden = expanded
      }
    })
  })
}
