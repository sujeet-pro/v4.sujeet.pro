# Frontend System Design Guidelines

This document provides guidance for writing articles in `content/articles/system-design/frontend-system-design/`.

These articles cover client-side architecture patterns and frontend-specific system design problems. They must address multiple implementation approaches, browser constraints, and performance trade-offs.

## Core Philosophy

### Client-Side Has Unique Constraints

Frontend system design differs from backend:
- **User device variability** - From low-end phones to high-end desktops
- **Network unpredictability** - 3G to fiber, offline scenarios
- **Browser limitations** - Main thread, memory limits, storage quotas
- **Perceived performance** - User perception matters more than raw metrics

### Multiple Valid Architectures

Every frontend problem has multiple solutions. The article must:

1. **Present all major approaches** - Not just the trendy one
2. **Device/network considerations** - What works on mobile vs desktop?
3. **Framework-agnostic first** - Concepts before React/Vue/Angular specifics
4. **Progressive enhancement path** - From simple to complex

### Design Path Structure

```markdown
## Design Paths

### Path 1: [Approach Name]

**Architecture:**
```
[Visual representation - component tree, data flow]
```

**How it works:**
[Detailed mechanism]

**Best for:**
- [Use case 1]
- [Use case 2]

**Device/network profile:**
- Works well on: [device types, network conditions]
- Struggles on: [device types, network conditions]

**Implementation complexity:**
| Aspect | Effort |
|--------|--------|
| Initial setup | Low/Medium/High |
| Feature additions | Low/Medium/High |
| Performance tuning | Low/Medium/High |
| Testing | Low/Medium/High |

**Real-world example:**
[Product] uses this because [reason].
Tech stack: [specific libraries/frameworks]
Result: [measurable outcomes]

**Trade-offs vs other paths:**
- ✅ [Advantage]
- ❌ [Disadvantage]

### Path 2: [Alternative Approach]

[Same structure]

### Decision Matrix

| Factor | Path 1 | Path 2 | Path 3 |
|--------|--------|--------|--------|
| Bundle size | Small | Medium | Large |
| Time to interactive | Fast | Medium | Slow |
| Offline support | None | Partial | Full |
| SEO | Poor | Good | Good |
| Development speed | Fast | Medium | Slow |
```

## Required Article Structure

### 1. Title and Description

```markdown
# [Pattern/Problem Name]

Client-side architecture for [problem]: approaches, trade-offs, and implementation strategies.
```

### 2. Problem Context

Why is this a frontend challenge?

```markdown
## The Challenge

### Browser Constraints

- **Main thread:** [How this affects the pattern]
- **Memory:** [Limitations and implications]
- **Storage:** [Quotas and persistence]

### User Experience Requirements

- **Perceived performance:** What must feel instant?
- **Offline behavior:** What should work without network?
- **Device support:** Mobile, desktop, tablet considerations

### Scale Factors

| Factor | Small Scale | Large Scale |
|--------|-------------|-------------|
| Data items | < 100 | > 10,000 |
| Update frequency | < 1/sec | > 100/sec |
| Concurrent users | Single | Multiple |
```

### 3. Design Paths Section (Required)

Cover ALL major approaches with concrete implementations:

```markdown
## Design Paths

### Virtualization Strategies [Example]

#### 1. Fixed-Height Virtualization

**How it works:**
Only render items visible in viewport. Calculate positions mathematically.

```typescript
interface VirtualListProps {
  items: Item[];
  itemHeight: number;  // Fixed height required
  containerHeight: number;
}

function VirtualList({ items, itemHeight, containerHeight }: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Best for:**
- Uniform content (log viewers, simple lists)
- Known item dimensions

**Performance characteristics:**
| Metric | Value |
|--------|-------|
| DOM nodes | O(viewport) ~20-50 |
| Scroll performance | 60fps |
| Memory | O(viewport) |
| Initial render | < 16ms |

**Real-world:** Discord message list uses fixed-height virtualization for the majority of messages. They pre-calculate heights for messages with embeds.

**Trade-offs:**
- ✅ Simplest implementation
- ✅ Best scroll performance
- ❌ Content must have uniform height
- ❌ Dynamic content (images loading) breaks layout

#### 2. Variable-Height Virtualization

**How it works:**
Measure items as they render, cache heights, estimate unrendered items.

```typescript
interface VariableVirtualListProps {
  items: Item[];
  estimatedItemHeight: number;
  containerHeight: number;
}

// Uses ResizeObserver to measure actual heights
// Maintains height cache: Map<index, measuredHeight>
// Binary search to find visible range
```

**Best for:**
- User-generated content (social feeds, chat)
- Cards with variable text/images

**Performance characteristics:**
| Metric | Value |
|--------|-------|
| DOM nodes | O(viewport) ~20-50 |
| Scroll performance | 30-60fps (measuring overhead) |
| Memory | O(n) for height cache |
| Initial render | 50-100ms (estimation) |

**Real-world:** Twitter/X feed uses variable-height virtualization. They solved the "jump on scroll" problem by keeping a larger buffer above the viewport.

**Trade-offs:**
- ✅ Handles real-world content
- ✅ Smooth scroll with proper buffering
- ❌ Complex implementation
- ❌ Scroll position jumps possible
- ❌ Height cache memory for large lists

#### 3. Windowing with Placeholders

**How it works:**
Render placeholders (skeletons) for unmeasured items, replace with real content as they enter viewport.

**Best for:**
- Infinite scroll with unknown total
- Content with slow-loading images

**Trade-offs:**
- ✅ Smoother perceived experience
- ✅ Better for images (no layout shift)
- ❌ More DOM operations
- ❌ Visual flash during replacement

### Library Comparison

| Library | Approach | Bundle Size | Best For |
|---------|----------|-------------|----------|
| react-window | Fixed/Variable | 6kb | Simple lists |
| react-virtuoso | Variable + grouping | 15kb | Complex lists |
| @tanstack/virtual | Framework-agnostic | 10kb | Any framework |
| vue-virtual-scroller | Variable | 12kb | Vue apps |

### Decision Framework

```mermaid
graph TD
    A[Need virtualization] --> B{All items same height?}
    B -->|Yes| C[Fixed-height virtualization]
    B -->|No| D{Items have images?}
    D -->|No| E[Variable-height]
    D -->|Yes| F{Images have known dimensions?}
    F -->|Yes| E
    F -->|No| G[Windowing with placeholders]
    C --> H{Which library?}
    E --> H
    G --> H
    H --> I{Framework?}
    I -->|React| J[react-window or react-virtuoso]
    I -->|Vue| K[vue-virtual-scroller]
    I -->|Vanilla/Other| L[@tanstack/virtual]
```
```

### 4. Browser Constraints Section

Address browser-specific concerns:

```markdown
## Browser Constraints

### Main Thread Budget

The main thread has 16ms per frame for 60fps:
- Parsing: [time impact]
- Layout: [time impact]
- Paint: [time impact]
- JavaScript: [time impact]

**Mitigation strategies:**
1. Web Workers for heavy computation
2. requestIdleCallback for non-critical work
3. Chunked rendering with requestAnimationFrame

### Memory Limits

| Device Type | Practical Limit | Crash Threshold |
|-------------|-----------------|-----------------|
| Low-end mobile | 50-100MB | 150MB |
| Mid-range mobile | 200-300MB | 500MB |
| Desktop | 500MB-1GB | 2GB |

**Memory optimization:**
- Object pooling for frequent allocations
- WeakMap for caches
- Explicit cleanup in unmount

### Storage Quotas

| Storage Type | Chrome | Safari | Firefox |
|--------------|--------|--------|---------|
| localStorage | 5MB | 5MB | 5MB |
| IndexedDB | 50% of disk | 1GB | 50% of disk |
| Cache API | 50% of disk | 50MB | 50% of disk |

**Quota exceeded handling:**
```typescript
try {
  await caches.put(request, response);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    await evictOldestEntries();
    await caches.put(request, response);
  }
}
```
```

### 5. Real-World Implementations (Required)

Show how products solve this:

```markdown
## Real-World Implementations

### Figma: Canvas Virtualization

**Challenge:** Millions of objects on infinite canvas

**Approach:**
- Spatial indexing (R-tree) for visible object query
- Level-of-detail rendering (simplify distant objects)
- Incremental rendering prioritizing viewport center

**Stack:**
- WebGL for rendering (bypasses DOM entirely)
- Custom virtualization (no library fits)
- WASM for geometry calculations

**Outcome:**
- 60fps with 100K+ objects
- 50ms initial render for complex files

**Key insight:** They don't use DOM for the canvas at all—WebGL gives them full control over what to render.

**Source:** [Figma engineering blog on rendering]

### Notion: Block-Based Virtualization

**Challenge:** Pages with 10K+ blocks, each potentially different height

**Approach:**
- Render blocks in visible viewport + buffer
- Estimate heights based on block type
- Measure and cache on render

**Stack:**
- React with custom virtualization
- IndexedDB for local cache
- Service Worker for offline

**Outcome:**
- < 100ms TTI for most pages
- Smooth scroll on mobile

**Trade-off accepted:** Small scroll position jumps when estimates are wrong—acceptable for content editing.

**Source:** [Notion engineering blog]
```

### 6. Performance Optimization Section

Concrete optimization techniques:

```markdown
## Performance Optimization

### Measurement First

```typescript
// Use Performance API to identify bottlenecks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'longtask') {
      console.log('Long task:', entry.duration, entry.attribution);
    }
  }
});
observer.observe({ entryTypes: ['longtask'] });
```

### Optimization Techniques by Impact

| Technique | Effort | Impact | When to Use |
|-----------|--------|--------|-------------|
| Virtualization | High | High | > 100 items |
| Memoization | Low | Medium | Re-render heavy |
| Code splitting | Medium | High | Large bundles |
| Web Worker | High | High | Heavy computation |
| requestIdleCallback | Low | Low | Non-critical work |

### Framework-Specific Patterns

**React:**
```typescript
// Avoid: Creating objects in render
<Component style={{ margin: 10 }} /> // New object every render

// Better: Stable references
const style = useMemo(() => ({ margin: 10 }), []);
<Component style={style} />
```

**Vue:**
```typescript
// Avoid: Reactive overhead for static data
const bigArray = reactive(items); // Every item is reactive

// Better: shallowRef for large collections
const bigArray = shallowRef(items);
```
```

### 7. Accessibility Considerations

Frontend design must consider accessibility:

```markdown
## Accessibility

### Keyboard Navigation

[Pattern]-specific keyboard requirements:
- [Key 1]: [Action]
- [Key 2]: [Action]

**Implementation:**
```typescript
function handleKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      focusNextItem();
      break;
    // ...
  }
}
```

### Screen Reader Support

ARIA requirements for [pattern]:
```html
<div role="listbox" aria-label="Search results">
  <div role="option" aria-selected="true">Item 1</div>
  <div role="option" aria-selected="false">Item 2</div>
</div>
```

### Reduced Motion

Respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```
```

### 8. Appendix Requirements

#### Prerequisites
- Browser APIs knowledge
- Framework fundamentals (if framework-specific)

#### Summary
- Key decision factors
- Recommended approach for common cases
- Performance targets

#### References
1. MDN documentation
2. Framework documentation
3. Web.dev performance guides
4. Product engineering blogs

## Quality Checklist

### Design Paths
- [ ] Multiple approaches presented (not just one library)
- [ ] Framework-agnostic concepts first
- [ ] Device/network considerations for each path
- [ ] Code examples for critical mechanisms

### Browser Constraints
- [ ] Main thread impact addressed
- [ ] Memory considerations covered
- [ ] Storage quotas mentioned if relevant
- [ ] Cross-browser differences noted

### Real-World Examples
- [ ] At least 2 production implementations
- [ ] Specific tech stack mentioned
- [ ] Measurable outcomes
- [ ] Trade-offs they accepted

### Accessibility
- [ ] Keyboard navigation covered
- [ ] Screen reader support addressed
- [ ] Reduced motion consideration
