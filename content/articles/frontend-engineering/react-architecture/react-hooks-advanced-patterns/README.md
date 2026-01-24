# React Hooks Advanced Patterns and Modern APIs

Advanced composition techniques, performance patterns, and modern hook APIs for large-scale React applications.

## TLDR

- **Composition unlocks scale**: combine small hooks into domain-specific abstractions.
- **Performance patterns** like virtualization and throttling keep UIs responsive.
- **Modern hooks** (e.g., `useId`) solve SSR, accessibility, and concurrency edge cases.

## Advanced Patterns and Compositions

### Hook Composition: Building Complex Abstractions

The true power of custom hooks lies in their ability to compose into more complex abstractions.

```tsx title="hook-composition-example.tsx"
// Example: Composed data fetching with caching and real-time updates
function useUserProfile(userId: string) {
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useFetch(`/api/users/${userId}`, {
    cacheTime: 5 * 60 * 1000,
  })

  const [isOnline, setIsOnline] = useLocalStorage(`user-${userId}-online`, false)

  const [ref, isVisible] = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
  })

  // Only fetch when visible
  useEffect(() => {
    if (isVisible && !user) {
      refetch()
    }
  }, [isVisible, user, refetch])

  return { user, error, isLoading, isOnline, isVisible, ref, refetch }
}
```

### Performance Optimization Patterns

```tsx title="virtualized-list-hook.tsx"
// Example: Optimized list rendering with virtualization
function useVirtualizedList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)
  const throttledSetScrollTop = useThrottle(setScrollTop, 16) // 60fps

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, items.length)
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const visibleItems = useMemo(() => items.slice(visibleRange.start, visibleRange.end), [items, visibleRange])

  return { visibleItems, visibleRange, totalHeight: items.length * itemHeight, onScroll: throttledSetScrollTop }
}
```

## Conclusion: Mastering the Hooks Paradigm

React Hooks represent a fundamental shift in how we think about component architecture. By understanding the underlying principles—state management, synchronization, composition, and performance optimization—we can build robust, maintainable applications that scale with our needs.

The key to mastering hooks is not memorizing specific implementations, but understanding how the fundamental primitives compose to solve complex problems. Each hook we've explored demonstrates this principle: simple building blocks that, when combined thoughtfully, create powerful abstractions.

**Key Takeaways**:

1. **Think in Terms of Composition**: Build small, focused hooks that can be combined into larger abstractions
2. **Handle Edge Cases**: Always consider error states, cleanup, and browser compatibility
3. **Optimize Strategically**: Use memoization to break render cascades, not just optimize individual calculations
4. **Document Thoroughly**: Clear APIs and comprehensive documentation make hooks more valuable
5. **Test Edge Cases**: Ensure your hooks work correctly in all scenarios, including error conditions

The patterns and implementations presented here provide a foundation for building production-ready custom hooks. As you continue to work with React, remember that the best hooks are those that solve real problems while remaining simple and composable.

## Modern React Hooks: Advanced Patterns and Use Cases

React has introduced several new hooks that address specific use cases and enable more advanced patterns. Understanding these hooks is crucial for building modern, performant applications.

### useId: Stable Unique Identifiers

**Problem Statement**: In server-rendered applications, generating unique IDs can cause hydration mismatches between server and client. We need stable, unique identifiers that work consistently across renders and environments ([useId Reference](https://react.dev/reference/react/useId)).

**Key Questions to Consider**:

- How do we ensure IDs are unique across multiple component instances?
- What happens during server-side rendering vs client-side hydration?
- How do we handle multiple IDs in the same component?
- Should we support custom prefixes or suffixes?

**Use Cases**:

- **Accessibility**: Connecting labels to form inputs
- **ARIA Attributes**: Generating unique IDs for aria-describedby, aria-labelledby
- **Testing**: Creating stable test IDs
- **Third-party Libraries**: Providing unique identifiers for external components

**Production Implementation**:

````tsx
import { useId } from "react"

/**
 * Generates stable, unique IDs for accessibility and testing.
 *
 * @param prefix - Optional prefix for the generated ID
 * @returns A unique ID string
 *
 * @example
 * ```tsx
 * function FormField({ label, error }) {
 *   const id = useId();
 *   const errorId = useId();
 *
 *   return (
 *     <div>
 *       <label htmlFor={id}>{label}</label>
 *       <input
 *         id={id}
 *         aria-describedby={error ? errorId : undefined}
 *         aria-invalid={!!error}
 *       />
 *       {error && <div id={errorId} role="alert">{error}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
function useStableId(prefix?: string): string {
  const id = useId()
  return prefix ? `${prefix}-${id}` : id
}

// Advanced usage with multiple IDs
function ComplexForm() {
  const baseId = useId()
  const emailId = `${baseId}-email`
  const passwordId = `${baseId}-password`
  const confirmId = `${baseId}-confirm`

  return (
    <form>
      <label htmlFor={emailId}>Email</label>
      <input id={emailId} type="email" />

      <label htmlFor={passwordId}>Password</label>
      <input id={passwordId} type="password" />

      <label htmlFor={confirmId}>Confirm Password</label>
      <input id={confirmId} type="password" />
    </form>
  )
}
````

**Food for Thought**:

- **Hydration Safety**: How does useId prevent hydration mismatches?
- **Performance**: Is there any performance cost to generating IDs?
- **Testing**: How can we make IDs predictable in test environments?
- **Accessibility**: What are the best practices for using IDs with screen readers?

### use: Consuming Promises and Context

**Problem Statement**: React needs a way to consume promises and context values in a way that integrates with Suspense and concurrent features. The `use` hook provides a unified API for consuming both promises and context ([use Reference](https://react.dev/reference/react/use)).

**Key Questions to Consider**:

- How does `use` integrate with React's Suspense boundary?
- What happens when a promise rejects?
- How do we handle multiple promises in the same component?
- Should we support promise cancellation?

**Use Cases**:

- **Data Fetching**: Consuming promises from data fetching libraries
- **Context Consumption**: Accessing context values in a Suspense-compatible way
- **Async Components**: Building components that can await promises
- **Resource Loading**: Managing loading states for external resources

**Production Implementation**:

```tsx
import { use, Suspense } from "react"

// Example: Data fetching with use
function UserProfile({ userId }: { userId: string }) {
  // use() will suspend if the promise is not resolved
  const user = use(fetchUser(userId))

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}

// Wrapper component with Suspense boundary
function UserProfileWrapper({ userId }: { userId: string }) {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userId={userId} />
    </Suspense>
  )
}

// Custom hook for data fetching with use
function useAsyncData<T>(promise: Promise<T>): T {
  return use(promise)
}

// Example with error boundaries
function UserProfileWithErrorBoundary({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<div>Error loading user</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  )
}
```

**Important Caveat**: Prefer creating promises in Server Components and passing them to Client Components. Promises created in Client Components are recreated on every render. For Client Components, use a Suspense-compatible library or framework that supports caching for promises.

**Advanced Patterns with use**:

```tsx title="use-hook-patterns.tsx"
// Multiple promises in the same component
function UserDashboard({ userId }: { userId: string }) {
  const user = use(fetchUser(userId))
  const posts = use(fetchUserPosts(userId))
  const followers = use(fetchUserFollowers(userId))

  return (
    <div>
      <h1>{user.name}</h1>
      <div>Posts: {posts.length}</div>
      <div>Followers: {followers.length}</div>
    </div>
  )
}

// Custom hook for managing multiple async resources
function useMultipleAsyncData<T extends Record<string, Promise<any>>>(promises: T): { [K in keyof T]: Awaited<T[K]> } {
  const result = {} as { [K in keyof T]: Awaited<T[K]> }

  for (const [key, promise] of Object.entries(promises)) {
    result[key as keyof T] = use(promise)
  }

  return result
}

// Usage
function UserProfileAdvanced({ userId }: { userId: string }) {
  const { user, posts, followers } = useMultipleAsyncData({
    user: fetchUser(userId),
    posts: fetchUserPosts(userId),
    followers: fetchUserFollowers(userId),
  })

  return (
    <div>
      <h1>{user.name}</h1>
      <div>Posts: {posts.length}</div>
      <div>Followers: {followers.length}</div>
    </div>
  )
}
```

**Food for Thought**:

- **Suspense Integration**: How does `use` work with React's Suspense mechanism?
- **Error Handling**: What's the best way to handle promise rejections?
- **Performance**: How does `use` affect component rendering and re-rendering?
- **Caching**: Should we implement caching for promises consumed with `use`?

### useLayoutEffect: Synchronous DOM Measurements

**Problem Statement**: Sometimes we need to perform DOM measurements and updates synchronously before the browser paints. `useLayoutEffect` runs synchronously after all DOM mutations but before the browser repaints ([useLayoutEffect Reference](https://react.dev/reference/react/useLayoutEffect)).

**Key Questions to Consider**:

- When should we use `useLayoutEffect` vs `useEffect`?
- How does `useLayoutEffect` affect performance?
- What happens if we perform expensive operations in `useLayoutEffect`?
- How do we handle cases where DOM measurements are not available?

**Use Cases**:

- **DOM Measurements**: Getting element dimensions, positions, or scroll positions
- **Synchronous Updates**: Making DOM changes that must happen before paint
- **Third-party Library Integration**: Working with libraries that need synchronous DOM access
- **Animation Coordination**: Ensuring animations start from the correct position

**Production Implementation**:

````tsx
import { useLayoutEffect, useRef, useState } from "react"

/**
 * Measures and tracks element dimensions with synchronous updates.
 *
 * @returns [ref, dimensions]
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const [ref, dimensions] = useElementSize();
 *
 *   return (
 *     <div ref={ref}>
 *       Width: {dimensions.width}, Height: {dimensions.height}
 *     </div>
 *   );
 * }
 * ```
 */
function useElementSize() {
  const ref = useRef<HTMLElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: rect.height,
      })
    }

    // Initial measurement
    updateDimensions()

    // Set up resize observer for continuous updates
    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return [ref, dimensions] as const
}

// Example: Tooltip positioning
function useTooltipPosition(tooltipRef: React.RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current
    if (!tooltip) return

    // Get tooltip dimensions
    const tooltipRect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate optimal position
    let left = tooltipRect.left
    let top = tooltipRect.top

    // Adjust if tooltip would overflow viewport
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - 10
    }

    if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - 10
    }

    // Apply position synchronously
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`
  })
}

// Example: Synchronous scroll restoration
function useScrollRestoration(key: string) {
  useLayoutEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll-${key}`)
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10))
    }

    return () => {
      sessionStorage.setItem(`scroll-${key}`, window.scrollY.toString())
    }
  }, [key])
}
````

**Food for Thought**:

- **Performance Impact**: How does `useLayoutEffect` affect rendering performance?
- **Browser Painting**: What's the difference between layout and paint phases?
- **Alternative Approaches**: When might `useEffect` with `requestAnimationFrame` be better?
- **Debugging**: How can we debug issues with `useLayoutEffect`?

### useSyncExternalStore: External State Synchronization

**Problem Statement**: React components need to subscribe to external state stores (like Redux, Zustand, or browser APIs) and re-render when that state changes. `useSyncExternalStore` provides a way to safely subscribe to external data sources in a way that's compatible with concurrent rendering ([useSyncExternalStore Reference](https://react.dev/reference/react/useSyncExternalStore)).

**Key Questions to Consider**:

- How do we handle server-side rendering with external stores?
- What happens when the external store changes during render?
- How do we implement proper cleanup for subscriptions?
- Should we support selective subscriptions to parts of the store?

**Use Cases**:

- **State Management Libraries**: Integrating with Redux, Zustand, or other state managers
- **Browser APIs**: Subscribing to localStorage, sessionStorage, or other browser state
- **Third-party Services**: Connecting to external APIs or services
- **Real-time Data**: Subscribing to WebSocket connections or server-sent events

**Production Implementation**:

```tsx title="sync-external-store.tsx" collapse={1-2, 5-32}
import { useSyncExternalStore, useCallback } from "react"

// Example: Custom store implementation
class CounterStore {
  private listeners: Set<() => void> = new Set()
  private state = { count: 0 }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot() {
    return this.state
  }

  increment() {
    this.state.count += 1
    this.notify()
  }

  decrement() {
    this.state.count -= 1
    this.notify()
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }
}

// Global store instance
const counterStore = new CounterStore()

// Hook to use the store
function useCounterStore() {
  const state = useSyncExternalStore(
    counterStore.subscribe.bind(counterStore),
    counterStore.getSnapshot.bind(counterStore),
  )

  return {
    count: state.count,
    increment: counterStore.increment.bind(counterStore),
    decrement: counterStore.decrement.bind(counterStore),
  }
}

// Example: Browser API integration
function useLocalStorageSync<T>(key: string, defaultValue: T) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key) {
          callback()
        }
      }

      window.addEventListener("storage", handleStorageChange)
      return () => {
        window.removeEventListener("storage", handleStorageChange)
      }
    },
    [key],
  )

  const getSnapshot = useCallback(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  }, [key, defaultValue])

  return useSyncExternalStore(subscribe, getSnapshot)
}

// Example: Redux-like store with selectors
class ReduxLikeStore<T> {
  private listeners: Set<() => void> = new Set()
  private state: T

  constructor(initialState: T) {
    this.state = initialState
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot() {
    return this.state
  }

  dispatch(action: (state: T) => T) {
    this.state = action(this.state)
    this.notify()
  }

  private notify() {
    this.listeners.forEach((listener) => listener())
  }
}

// Hook with selector support
function useStoreSelector<T, R>(store: ReduxLikeStore<T>, selector: (state: T) => R): R {
  const subscribe = useCallback(
    (callback: () => void) => {
      return store.subscribe(callback)
    },
    [store],
  )

  const getSnapshot = useCallback(() => {
    return selector(store.getSnapshot())
  }, [store, selector])

  return useSyncExternalStore(subscribe, getSnapshot)
}

// Usage example
const userStore = new ReduxLikeStore({
  user: null,
  isAuthenticated: false,
  preferences: {},
})

function UserProfile() {
  const user = useStoreSelector(userStore, (state) => state.user)
  const isAuthenticated = useStoreSelector(userStore, (state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <div>Please log in</div>
  }

  return <div>Welcome, {user?.name}!</div>
}
```

**Important Considerations**:

- **Tearing Prevention**: While `useEffect` and `useState` can subscribe to external stores, this pattern is prone to tearing in concurrent rendering. `useSyncExternalStore` guarantees consistent snapshots across render passes.
- **SSR Support**: Pass a `getServerSnapshot` function as the third argument to provide initial values during server-side rendering.
- **Suspense Caveat**: Avoid suspending based on store values—mutations to external stores cannot be marked as non-blocking transitions.

**Food for Thought**:

- **Server-Side Rendering**: How does `useSyncExternalStore` handle SSR?
- **Performance**: What's the performance impact of subscribing to external stores?
- **Memory Leaks**: How do we prevent memory leaks with external subscriptions?
- **Selective Updates**: When should we use selectors vs subscribing to the entire store?

### useInsertionEffect: CSS-in-JS and Style Injection

**Problem Statement**: CSS-in-JS libraries need to inject styles into the DOM before other effects run. `useInsertionEffect` runs synchronously before all other effects, making it perfect for style injection ([useInsertionEffect Reference](https://react.dev/reference/react/useInsertionEffect)).

**Key Questions to Consider**:

- When should we use `useInsertionEffect` vs `useLayoutEffect`?
- How do we handle style conflicts and specificity?
- What happens if styles are injected multiple times?
- How do we clean up injected styles?

**Use Cases**:

- **CSS-in-JS Libraries**: Injecting dynamic styles
- **Theme Systems**: Applying theme styles before render
- **Dynamic Styling**: Injecting styles based on props or state
- **Third-party Style Integration**: Working with external style systems

**Production Implementation**:

````tsx
import { useInsertionEffect, useRef } from "react"

/**
 * Injects CSS styles into the document head.
 *
 * @param styles - CSS string to inject
 * @param id - Unique identifier for the style tag
 *
 * @example
 * ```tsx
 * function ThemedComponent({ theme }) {
 *   useStyleInjection(`
 *     .themed-component {
 *       background-color: ${theme.backgroundColor};
 *       color: ${theme.textColor};
 *     }
 *   `, 'themed-component-styles');
 *
 *   return <div className="themed-component">Content</div>;
 * }
 * ```
 */
function useStyleInjection(styles: string, id: string) {
  useInsertionEffect(() => {
    // Check if styles already exist
    if (document.getElementById(id)) {
      return
    }

    const styleElement = document.createElement("style")
    styleElement.id = id
    styleElement.textContent = styles
    document.head.appendChild(styleElement)

    return () => {
      const existingStyle = document.getElementById(id)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [styles, id])
}

// Example: Dynamic theme injection
function useThemeStyles(theme: Theme) {
  const themeId = `theme-${theme.name}`

  useInsertionEffect(() => {
    const css = `
      :root {
        --primary-color: ${theme.colors.primary};
        --secondary-color: ${theme.colors.secondary};
        --text-color: ${theme.colors.text};
        --background-color: ${theme.colors.background};
      }
    `

    let styleElement = document.getElementById(themeId)
    if (!styleElement) {
      styleElement = document.createElement("style")
      styleElement.id = themeId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = css
  }, [theme, themeId])
}

// Example: CSS-in-JS library integration
class StyleManager {
  private styles = new Map<string, string>()
  private styleElement: HTMLStyleElement | null = null

  injectStyles(id: string, css: string) {
    this.styles.set(id, css)
    this.updateStyles()
  }

  removeStyles(id: string) {
    this.styles.delete(id)
    this.updateStyles()
  }

  private updateStyles() {
    if (!this.styleElement) {
      this.styleElement = document.createElement("style")
      this.styleElement.setAttribute("data-styled-components", "")
      document.head.appendChild(this.styleElement)
    }

    this.styleElement.textContent = Array.from(this.styles.values()).join("\n")
  }
}

const styleManager = new StyleManager()

function useStyledComponent(componentId: string, css: string) {
  useInsertionEffect(() => {
    styleManager.injectStyles(componentId, css)

    return () => {
      styleManager.removeStyles(componentId)
    }
  }, [componentId, css])
}
````

**Food for Thought**:

- **Style Specificity**: How do we handle CSS specificity conflicts?
- **Performance**: What's the performance impact of injecting styles?
- **Cleanup**: How do we ensure styles are properly cleaned up?
- **Server-Side Rendering**: How does `useInsertionEffect` work with SSR?

### useDeferredValue: Deferring Expensive Updates

**Problem Statement**: Sometimes we need to defer expensive updates to prevent blocking the UI. `useDeferredValue` allows us to defer updates to non-critical values while keeping the UI responsive ([useDeferredValue Reference](https://react.dev/reference/react/useDeferredValue)).

**Key Questions to Consider**:

- When should we use `useDeferredValue` vs `useTransition`?
- How do we handle the relationship between deferred and current values?
- What's the performance impact of deferring updates?
- How do we ensure the deferred value eventually catches up?

**Use Cases**:

- **Search Results**: Deferring expensive search result updates
- **Large Lists**: Deferring updates to large data sets
- **Complex Calculations**: Deferring expensive computations
- **Real-time Updates**: Managing high-frequency updates without blocking UI

**Production Implementation**:

````tsx
import { useDeferredValue, useState, useMemo } from "react"

/**
 * Hook for managing deferred search results with loading states.
 *
 * @param searchTerm - The current search term
 * @param searchFunction - Function to perform the search
 * @returns [deferredResults, isPending]
 *
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const [results, isPending] = useDeferredSearch(
 *     searchTerm,
 *     performExpensiveSearch
 *   );
 *
 *   return (
 *     <div>
 *       <input
 *         value={searchTerm}
 *         onChange={(e) => setSearchTerm(e.target.value)}
 *         placeholder="Search..."
 *       />
 *       {isPending && <div>Searching...</div>}
 *       <SearchResults results={results} />
 *     </div>
 *   );
 * }
 * ```
 */
function useDeferredSearch<T>(searchTerm: string, searchFunction: (term: string) => T[]): [T[], boolean] {
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const isPending = searchTerm !== deferredSearchTerm

  const results = useMemo(() => {
    return searchFunction(deferredSearchTerm)
  }, [deferredSearchTerm, searchFunction])

  return [results, isPending]
}

// Example: Large list with deferred updates
function useDeferredList<T>(items: T[], filterFunction: (item: T) => boolean): [T[], boolean] {
  const deferredItems = useDeferredValue(items)
  const isPending = items !== deferredItems

  const filteredItems = useMemo(() => {
    return deferredItems.filter(filterFunction)
  }, [deferredItems, filterFunction])

  return [filteredItems, isPending]
}

// Example: Complex data processing
function useDeferredCalculation<T, R>(data: T, calculationFunction: (data: T) => R): [R, boolean] {
  const deferredData = useDeferredValue(data)
  const isPending = data !== deferredData

  const result = useMemo(() => {
    return calculationFunction(deferredData)
  }, [deferredData, calculationFunction])

  return [result, isPending]
}

// Example: Real-time data with deferred updates
function useDeferredRealTimeData<T>(dataStream: T[], processFunction: (data: T[]) => T[]): [T[], boolean] {
  const deferredDataStream = useDeferredValue(dataStream)
  const isPending = dataStream !== deferredDataStream

  const processedData = useMemo(() => {
    return processFunction(deferredDataStream)
  }, [deferredDataStream, processFunction])

  return [processedData, isPending]
}

// Usage example
function DataVisualization({ data }: { data: number[] }) {
  const [processedData, isPending] = useDeferredCalculation(data, (numbers) => {
    // Expensive calculation
    return numbers.map((n) => Math.pow(n, 2)).filter((n) => n > 100)
  })

  return (
    <div>
      {isPending && <div>Processing data...</div>}
      <Chart data={processedData} />
    </div>
  )
}
````

**Food for Thought**:

- **Update Frequency**: How often should deferred values be updated?
- **Memory Usage**: What's the memory impact of keeping both current and deferred values?
- **User Experience**: How do we communicate pending states to users?
- **Performance Trade-offs**: When is the performance cost worth the UI responsiveness?

### useTransition: Managing Loading States

**Problem Statement**: We need to manage loading states for non-urgent updates without blocking the UI. `useTransition` allows us to mark updates as non-urgent and track their loading state ([useTransition Reference](https://react.dev/reference/react/useTransition)).

**Key Questions to Consider**:

- When should we use `useTransition` vs `useDeferredValue`?
- How do we handle multiple concurrent transitions?
- What happens if a transition is interrupted?
- How do we communicate transition states to users?

**Use Cases**:

- **Navigation**: Managing route transitions
- **Data Fetching**: Handling non-critical data updates
- **Form Submissions**: Managing form submission states
- **Bulk Operations**: Handling large batch operations

**Production Implementation**:

````tsx
import { useTransition, useState } from "react"

/**
 * Hook for managing form submission with transition states.
 *
 * @param submitFunction - Function to handle form submission
 * @returns [submit, isPending, error]
 *
 * @example
 * ```tsx
 * function ContactForm() {
 *   const [submit, isPending, error] = useFormSubmission(handleSubmit);
 *
 *   const handleFormSubmit = async (formData) => {
 *     await submit(formData);
 *   };
 *
 *   return (
 *     <form onSubmit={handleFormSubmit}>
 *       {isPending && <div>Submitting...</div>}
 *       {error && <div>Error: {error.message}</div>}
 *       <button type="submit" disabled={isPending}>
 *         {isPending ? 'Submitting...' : 'Submit'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
function useFormSubmission<T>(
  submitFunction: (data: T) => Promise<void>,
): [(data: T) => Promise<void>, boolean, Error | null] {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<Error | null>(null)

  const submit = async (data: T) => {
    setError(null)

    startTransition(async () => {
      try {
        await submitFunction(data)
      } catch (err) {
        setError(err as Error)
      }
    })
  }

  return [submit, isPending, error]
}

// Example: Navigation with transitions
function useNavigationTransition() {
  const [isPending, startTransition] = useTransition()
  const [currentRoute, setCurrentRoute] = useState("/")

  const navigate = (route: string) => {
    startTransition(() => {
      setCurrentRoute(route)
    })
  }

  return { navigate, currentRoute, isPending }
}

// Example: Bulk operations
function useBulkOperation<T>(
  operationFunction: (items: T[]) => Promise<void>,
): [(items: T[]) => Promise<void>, boolean] {
  const [isPending, startTransition] = useTransition()

  const performOperation = async (items: T[]) => {
    startTransition(async () => {
      await operationFunction(items)
    })
  }

  return [performOperation, isPending]
}

// Example: Data synchronization
function useDataSync<T>(syncFunction: (data: T) => Promise<void>): [(data: T) => Promise<void>, boolean, string] {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState("idle")

  const sync = async (data: T) => {
    setStatus("syncing")

    startTransition(async () => {
      try {
        await syncFunction(data)
        setStatus("synced")
      } catch (error) {
        setStatus("error")
      }
    })
  }

  return [sync, isPending, status]
}

// Usage example
function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [performBulkDelete, isDeleting] = useBulkOperation(async (userIds: string[]) => {
    await Promise.all(userIds.map((id) => deleteUser(id)))
    setUsers((prev) => prev.filter((user) => !userIds.includes(user.id)))
  })

  const handleBulkDelete = async (selectedUsers: User[]) => {
    await performBulkDelete(selectedUsers.map((user) => user.id))
  }

  return (
    <div>
      {isDeleting && <div>Deleting users...</div>}
      <UserList users={users} onBulkDelete={handleBulkDelete} />
    </div>
  )
}
````

**Food for Thought**:

- **Concurrent Transitions**: How do we handle multiple transitions happening simultaneously?
- **Interruption Handling**: What happens when a transition is interrupted by a more urgent update?
- **Error Boundaries**: How do transitions interact with React's error boundary system?
- **Performance Monitoring**: How can we measure the performance impact of transitions?

## Advanced Hook Composition Patterns

### Combining Modern Hooks for Complex Use Cases

The true power of modern React hooks lies in their ability to compose into sophisticated patterns that solve complex real-world problems.

```tsx
// Example: Advanced data fetching with modern hooks
function useAdvancedDataFetching<T>(
  url: string,
  options: {
    enabled?: boolean
    cacheTime?: number
    retryCount?: number
    retryDelay?: number
  } = {},
) {
  const { enabled = true, cacheTime = 5 * 60 * 1000, retryCount = 3, retryDelay = 1000 } = options

  // Use useId for stable cache keys
  const cacheKey = useId()

  // Use useSyncExternalStore for cache management
  const cache = useSyncExternalStore(cacheStore.subscribe, cacheStore.getSnapshot)

  // Use use for promise consumption
  const data = use(fetchWithRetry(url, retryCount, retryDelay))

  // Use useLayoutEffect for cache updates
  useLayoutEffect(() => {
    if (data) {
      cacheStore.set(cacheKey, data, cacheTime)
    }
  }, [data, cacheKey, cacheTime])

  return data
}

// Example: Real-time component with modern hooks
function useRealTimeComponent<T>(dataSource: () => Promise<T>, updateInterval: number) {
  const [data, setData] = useState<T | null>(null)
  const [isPending, startTransition] = useTransition()
  const deferredData = useDeferredValue(data)

  // Use useInsertionEffect for real-time styles
  useInsertionEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .real-time-component {
        transition: opacity 0.2s ease-in-out;
      }
      .real-time-component.updating {
        opacity: 0.7;
      }
    `
    document.head.appendChild(style)

    return () => style.remove()
  }, [])

  // Use useLayoutEffect for immediate updates
  useLayoutEffect(() => {
    const interval = setInterval(() => {
      startTransition(async () => {
        const newData = await dataSource()
        setData(newData)
      })
    }, updateInterval)

    return () => clearInterval(interval)
  }, [dataSource, updateInterval, startTransition])

  return { data: deferredData, isPending }
}
```

**Food for Thought**:

- **Hook Order**: How do we ensure hooks are called in the correct order when composing multiple hooks?
- **Performance**: What's the performance impact of complex hook compositions?
- **Testing**: How do we test components that use multiple modern hooks?
- **Debugging**: What tools and techniques help debug complex hook interactions?

## References

- [React Hooks Documentation](https://react.dev/reference/react/hooks) - Official React documentation for all hooks
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) - Official rules and constraints for using hooks
- [Built-in React Hooks](https://react.dev/reference/react/hooks) - Complete reference for useState, useEffect, useContext, etc.
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) - Guide to building custom hooks
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) - Subscribing to external stores
- [useTransition](https://react.dev/reference/react/useTransition) - Managing transitions and loading states
- [useDeferredValue](https://react.dev/reference/react/useDeferredValue) - Deferring non-critical updates
- [React 19 use Hook](https://react.dev/reference/react/use) - Consuming promises and context with use
