export function initImageModal() {
  const modal = document.getElementById("image-modal")
  const modalBody = document.getElementById("image-modal-body")
  const backdrop = modal?.querySelector(".image-modal-backdrop")
  const closeBtn = document.getElementById("image-modal-close")
  const zoomInBtn = document.getElementById("image-zoom-in")
  const zoomOutBtn = document.getElementById("image-zoom-out")
  const zoomResetBtn = document.getElementById("image-zoom-reset")
  const zoomLevelDisplay = document.getElementById("image-zoom-level")

  if (!modal || !modalBody) return

  let currentZoom = 1
  let translateX = 0
  let translateY = 0
  let currentImage: HTMLElement | null = null
  const activePointers = new Map<number, { x: number; y: number }>()
  let panStartX = 0
  let panStartY = 0
  let pinchStartDistance = 0
  let pinchStartZoom = 1
  let pinchStartCenter = { x: 0, y: 0 }
  let pinchStartTranslateX = 0
  let pinchStartTranslateY = 0
  const ZOOM_STEP = 0.1
  const MIN_ZOOM = 0.5
  const MAX_ZOOM_IMG = 5
  const MAX_ZOOM_SVG = 10
  let maxZoom = MAX_ZOOM_IMG

  function clampZoom(value: number) {
    return Math.min(maxZoom, Math.max(MIN_ZOOM, value))
  }

  function constrainPan() {
    if (!currentImage || !modalBody) return false
    const bodyRect = modalBody.getBoundingClientRect()
    const imageRect = currentImage.getBoundingClientRect()
    if (bodyRect.width === 0 || bodyRect.height === 0) return false

    let deltaX = 0
    if (imageRect.width <= bodyRect.width) {
      const targetLeft = bodyRect.left + (bodyRect.width - imageRect.width) / 2
      deltaX = targetLeft - imageRect.left
    } else {
      if (imageRect.left > bodyRect.left) {
        deltaX = bodyRect.left - imageRect.left
      } else if (imageRect.right < bodyRect.right) {
        deltaX = bodyRect.right - imageRect.right
      }
    }

    let deltaY = 0
    if (imageRect.height <= bodyRect.height) {
      const targetTop = bodyRect.top + (bodyRect.height - imageRect.height) / 2
      deltaY = targetTop - imageRect.top
    } else {
      if (imageRect.top > bodyRect.top) {
        deltaY = bodyRect.top - imageRect.top
      } else if (imageRect.bottom < bodyRect.bottom) {
        deltaY = bodyRect.bottom - imageRect.bottom
      }
    }

    if (deltaX !== 0 || deltaY !== 0) {
      translateX += deltaX
      translateY += deltaY
      return true
    }
    return false
  }

  function applyTransform() {
    if (!currentImage) return
    currentImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`
    if (constrainPan()) {
      currentImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`
    }
    currentImage.style.cursor = currentZoom > 1 ? "grab" : "zoom-in"
  }

  function updateZoomLevel() {
    if (zoomLevelDisplay) {
      zoomLevelDisplay.textContent = `${currentZoom.toFixed(1)}X`
    }
    applyTransform()
  }

  function resetPan() {
    translateX = 0
    translateY = 0
  }

  function openModal(sourceElement: HTMLElement) {
    // Clone the element
    const clone = sourceElement.cloneNode(true) as HTMLElement

    // Reset any transforms on the clone
    clone.style.transform = ""
    clone.style.cursor = "grab"
    clone.classList.add("image-modal-image")
    clone.setAttribute("draggable", "false")

    if (clone instanceof SVGSVGElement) {
      const viewBox = clone.viewBox?.baseVal
      if (viewBox?.width && viewBox?.height) {
        clone.setAttribute("width", String(viewBox.width))
        clone.setAttribute("height", String(viewBox.height))
        clone.style.width = `${viewBox.width}px`
        clone.style.height = `${viewBox.height}px`
      }
    }

    if (clone instanceof HTMLImageElement) {
      const widthAttr = clone.getAttribute("width")
      const heightAttr = clone.getAttribute("height")
      const parsedWidth = widthAttr ? Number.parseFloat(widthAttr) : NaN
      const parsedHeight = heightAttr ? Number.parseFloat(heightAttr) : NaN

      if (!Number.isNaN(parsedWidth)) {
        clone.style.width = `${parsedWidth}px`
      }
      if (!Number.isNaN(parsedHeight)) {
        clone.style.height = `${parsedHeight}px`
      }

      const applyNaturalSize = () => {
        if (Number.isNaN(parsedWidth) && clone.naturalWidth) {
          clone.style.width = `${clone.naturalWidth}px`
        }
        if (Number.isNaN(parsedHeight) && clone.naturalHeight) {
          clone.style.height = `${clone.naturalHeight}px`
        }
      }

      if (clone.complete) {
        applyNaturalSize()
      } else {
        clone.addEventListener("load", applyNaturalSize, { once: true })
      }
    }

    // Remove any click handlers by cloning
    clone.removeAttribute("onclick")

    // Clear previous content and add new
    if (modalBody) {
      modalBody.innerHTML = ""
      modalBody.appendChild(clone)
    }

    currentImage = clone
    currentZoom = 1
    maxZoom = clone instanceof SVGSVGElement ? MAX_ZOOM_SVG : MAX_ZOOM_IMG
    resetPan()
    activePointers.clear()

    // Show modal
    modal?.classList.add("open")
    document.body.style.overflow = "hidden"
    closeBtn?.focus()

    requestAnimationFrame(() => updateZoomLevel())
  }

  function closeModal() {
    modal?.classList.remove("open")
    document.body.style.overflow = ""
    if (modalBody) modalBody.innerHTML = ""
    currentImage = null
    currentZoom = 1
    resetPan()
    activePointers.clear()
    if (modalBody) {
      modalBody.style.justifyContent = ""
      modalBody.style.alignItems = ""
    }
  }

  function zoomIn() {
    if (currentZoom < maxZoom) {
      currentZoom = clampZoom(currentZoom + ZOOM_STEP)
      updateZoomLevel()
    }
  }

  function zoomOut() {
    if (currentZoom > MIN_ZOOM) {
      currentZoom = clampZoom(currentZoom - ZOOM_STEP)
      updateZoomLevel()
    }
  }

  function resetZoom() {
    currentZoom = 1
    resetPan()
    updateZoomLevel()
  }

  // Event listeners
  closeBtn?.addEventListener("click", closeModal)
  backdrop?.addEventListener("click", closeModal)
  zoomInBtn?.addEventListener("click", zoomIn)
  zoomOutBtn?.addEventListener("click", zoomOut)
  zoomResetBtn?.addEventListener("click", resetZoom)

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return

    switch (e.key) {
      case "Escape":
        closeModal()
        break
      case "+":
      case "=":
        zoomIn()
        break
      case "-":
        zoomOut()
        break
      case "0":
        resetZoom()
        break
    }
  })

  // Mouse wheel / trackpad zoom
  modalBody.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault()
      if (!currentImage) return
      if (e.deltaY < 0) {
        zoomIn()
      } else {
        zoomOut()
      }
    },
    { passive: false },
  )

  function getDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function getCenter(a: { x: number; y: number }, b: { x: number; y: number }) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  function handlePointerDown(e: PointerEvent) {
    if (!currentImage) return
    if (e.pointerType === "mouse" && e.button !== 0) return
    const target = (e.target as Element | null)?.closest(".image-modal-image")
    if (!target) return

    e.preventDefault()
    ;(target as HTMLElement).setPointerCapture(e.pointerId)
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointers.size === 1) {
      panStartX = e.clientX - translateX
      panStartY = e.clientY - translateY
      currentImage.style.cursor = "grabbing"
    } else if (activePointers.size === 2) {
      const [p1, p2] = [...activePointers.values()]
      if (!p1 || !p2) return
      pinchStartDistance = getDistance(p1, p2)
      pinchStartZoom = currentZoom
      pinchStartCenter = getCenter(p1, p2)
      pinchStartTranslateX = translateX
      pinchStartTranslateY = translateY
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!currentImage || !activePointers.has(e.pointerId)) return
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (activePointers.size === 1) {
      const point = activePointers.values().next().value
      if (!point) return
      translateX = point.x - panStartX
      translateY = point.y - panStartY
      applyTransform()
      return
    }

    if (activePointers.size >= 2) {
      const [p1, p2] = [...activePointers.values()]
      if (!p1 || !p2) return
      const distance = getDistance(p1, p2)
      if (pinchStartDistance > 0) {
        currentZoom = clampZoom(pinchStartZoom * (distance / pinchStartDistance))
        const center = getCenter(p1, p2)
        translateX = pinchStartTranslateX + (center.x - pinchStartCenter.x)
        translateY = pinchStartTranslateY + (center.y - pinchStartCenter.y)
        updateZoomLevel()
      }
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (!activePointers.has(e.pointerId)) return
    activePointers.delete(e.pointerId)

    if (activePointers.size === 1) {
      const point = activePointers.values().next().value
      if (!point) return
      panStartX = point.x - translateX
      panStartY = point.y - translateY
    }

    if (activePointers.size < 2) {
      pinchStartDistance = 0
    }

    if (activePointers.size === 0 && currentImage) {
      currentImage.style.cursor = currentZoom > 1 ? "grab" : "zoom-in"
    }
  }

  modalBody.addEventListener("pointerdown", handlePointerDown)
  modalBody.addEventListener("pointermove", handlePointerMove)
  modalBody.addEventListener("pointerup", handlePointerUp)
  modalBody.addEventListener("pointercancel", handlePointerUp)

  // Attach click handlers to images in articles
  function attachImageHandlers() {
    // Select images and SVGs within prose/article content
    const selectors = [
      ".prose img:not([data-no-modal])",
      ".prose svg:not([data-icon]):not([data-no-modal])",
      "article img:not([data-no-modal])",
      "article svg:not([data-icon]):not([data-no-modal])",
      "figure img:not([data-no-modal])",
      "figure svg:not([data-icon]):not([data-no-modal])",
    ]

    const images = document.querySelectorAll<HTMLElement>(selectors.join(", "))

    images.forEach((img) => {
      // Skip if already has handler
      if (img.dataset.modalEnabled) return

      img.dataset.modalEnabled = "true"
      img.style.cursor = "zoom-in"

      img.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        openModal(img)
      })
    })
  }

  // Initialize handlers
  attachImageHandlers()

  // Re-attach on dynamic content changes (for Astro View Transitions)
  const observer = new MutationObserver(() => {
    attachImageHandlers()
  })

  const article = document.querySelector("article") || document.querySelector(".prose")
  if (article) {
    observer.observe(article, { childList: true, subtree: true })
  }
}
