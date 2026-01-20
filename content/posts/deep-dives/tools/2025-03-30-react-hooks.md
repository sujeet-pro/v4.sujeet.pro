---
lastUpdatedOn: 2025-03-30
featured: true
tags:
  - react
  - hooks
  - architecture
  - performance
---

# React Hooks

Master React Hooks' architectural principles, design patterns, and implementation strategies for building scalable, maintainable applications with functional components.

## TLDR

**React Hooks** revolutionized React by enabling functional components to manage state and side effects, replacing class components with a more intuitive, composable architecture.

### Core Principles

- **Co-location of Logic**: Related functionality grouped together instead of scattered across lifecycle methods
- **Clean Reusability**: Logic extracted into custom hooks without altering component hierarchy
- **Simplified Mental Model**: Components become pure functions that map state to UI
- **Rules of Hooks**: Must be called at top level, only from React functions or custom hooks

### Essential Hooks

- **useState**: Foundation for state management with functional updates
- **useReducer**: Complex state logic with centralized updates and predictable patterns
- **useEffect**: Synchronization with external systems, side effects, and cleanup
- **useRef**: Imperative escape hatch for DOM references and mutable values
- **useMemo/useCallback**: Performance optimization through memoization

### Performance Optimization

- **Strategic Memoization**: Break render cascades, not optimize individual calculations
- **Referential Equality**: Preserve object/function references to prevent unnecessary re-renders
- **Dependency Arrays**: Proper dependency management to avoid stale closures and infinite loops

### Custom Hooks Architecture

- **Single Responsibility**: Each hook does one thing well
- **Composition Over Monoliths**: Compose smaller, focused hooks
- **Clear API**: Simple, predictable inputs and outputs
- **Production-Ready Patterns**: usePrevious, useDebounce, useFetch with proper error handling

### Advanced Patterns

- **State Machines**: Complex state transitions with useReducer
- **Effect Patterns**: Synchronization, cleanup, and dependency management
- **Performance Monitoring**: Profiling and optimization strategies
- **Testing Strategies**: Unit testing hooks in isolation

### Migration & Best Practices

- **Class to Function Migration**: Systematic approach to converting existing components
- **Error Boundaries**: Proper error handling for hooks-based applications
- **TypeScript Integration**: Full type safety for hooks and custom hooks
- **Performance Considerations**: When and how to optimize with memoization


## The Paradigm Shift: From Classes to Functions

### The Pre-Hooks Landscape

Before Hooks, React's class component model introduced several architectural challenges:

**Wrapper Hell**: Higher-Order Components (HOCs) and Render Props, while effective, created deeply nested component hierarchies that were difficult to debug and maintain.

**Fragmented Logic**: Related functionality was scattered across disparate lifecycle methods. A data subscription might be set up in `componentDidMount`, updated in `componentDidUpdate`, and cleaned up in `componentWillUnmount`.

**`this` Binding Complexity**: JavaScript's `this` keyword introduced cognitive overhead and boilerplate code that distracted from business logic.

### Hooks as Architectural Solution

Hooks solve these problems by enabling:

- **Co-location of Related Logic**: All code for a single concern can be grouped together
- **Clean Reusability**: Logic can be extracted into custom hooks without altering component hierarchy
- **Simplified Mental Model**: Components become pure functions that map state to UI

## The Rules of Hooks: A Contract with React's Renderer

Hooks operate under strict rules that are fundamental to React's internal state management mechanism.

### Rule 1: Only Call Hooks at the Top Level

Hooks must be called in the same order on every render. This is because React relies on call order to associate state with each hook call.

```tsx
// ❌ Violates the rule
function BadComponent({ condition }) {
  const [count, setCount] = useState(0)

  if (condition) {
    useEffect(() => {
      console.log("Conditional effect")
    })
  }

  const [name, setName] = useState("")
  // State misalignment occurs here
}

// ✅ Correct approach
function GoodComponent({ condition }) {
  const [count, setCount] = useState(0)
  const [name, setName] = useState("")

  useEffect(() => {
    if (condition) {
      console.log("Conditional effect")
    }
  }, [condition])
}
```

### Rule 2: Only Call Hooks from React Functions

Hooks can only be called from:

- React function components
- Custom hooks (functions starting with `use`)

This ensures all stateful logic is encapsulated within component scope.

## Core Hooks: Understanding the Primitives

### useState: The Foundation of State Management

`useState` is the most fundamental hook for adding state to functional components.

```tsx
const [state, setState] = useState(initialValue)
```

**Key Characteristics:**

- Returns current state and a setter function
- Triggers re-renders when state changes
- Supports functional updates for state-dependent changes

**Functional Updates Pattern:**

```tsx
// ❌ Potential stale closure
setCount(count + 1)

// ✅ Safe functional update
setCount((prevCount) => prevCount + 1)
```

### useReducer: Complex State Logic

`useReducer` provides a more structured approach to state management, inspired by Redux.

```tsx
const [state, dispatch] = useReducer(reducer, initialState)
```

**When to Choose useReducer over useState:**

| Aspect         | useState                       | useReducer                      |
| -------------- | ------------------------------ | ------------------------------- |
| State Shape    | Simple, independent values     | Complex, interrelated objects   |
| Update Logic   | Co-located with event handlers | Centralized in reducer function |
| Predictability | Scattered across component     | Single source of truth          |
| Testability    | Tightly coupled to component   | Pure function, easily testable  |

**Example: Form State Management**

```tsx
type FormState = {
  email: string
  password: string
  errors: Record<string, string>
  isSubmitting: boolean
}

type FormAction =
  | { type: "SET_FIELD"; field: string; value: string }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "SET_SUBMITTING"; isSubmitting: boolean }
  | { type: "RESET" }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "SET_ERRORS":
      return { ...state, errors: action.errors }
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.isSubmitting }
    case "RESET":
      return initialState
    default:
      return state
  }
}
```

### useEffect: Synchronization with External Systems

`useEffect` is React's primary tool for managing side effects and synchronizing with external systems.

**Mental Model: Synchronization, Not Lifecycle**

Think of `useEffect` as a synchronization primitive that keeps external systems in sync with your component's state.

```tsx
useEffect(() => {
  // Setup: Synchronize external system with component state
  const subscription = subscribeToData(userId)

  // Cleanup: Remove old synchronization before applying new one
  return () => {
    subscription.unsubscribe()
  }
}, [userId]) // Re-synchronize when userId changes
```

**Dependency Array Patterns:**

```tsx
// Run on every render (usually undesirable)
useEffect(() => {
  console.log("Every render")
})

// Run only on mount
useEffect(() => {
  console.log("Only on mount")
}, [])

// Run when dependencies change
useEffect(() => {
  console.log("When deps change")
}, [dep1, dep2])
```

**Common Pitfalls:**

1. **Stale Closures**: Forgetting dependencies
2. **Infinite Loops**: Including objects/functions that change on every render
3. **Missing Cleanup**: Not cleaning up subscriptions, timers, or event listeners

### useRef: The Imperative Escape Hatch

`useRef` provides a way to hold mutable values that don't trigger re-renders.

**Two Primary Use Cases:**

1. **DOM References**: Accessing DOM nodes directly
2. **Mutable Values**: Storing values outside the render cycle

```tsx
function TextInputWithFocus() {
  const inputRef = useRef<HTMLInputElement>(null)

  const focusInput = () => {
    inputRef.current?.focus()
  }

  return (
    <>
      <input ref={inputRef} type="text" />
      <button onClick={focusInput}>Focus Input</button>
    </>
  )
}
```

**Mutable Values Pattern:**

```tsx
function TimerComponent() {
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      console.log("Tick")
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
}
```

## Performance Optimization: Memoization Hooks

### The Problem: Referential Equality

JavaScript objects and functions are reference types, meaning they're recreated on every render.

```tsx
function ParentComponent() {
  const [count, setCount] = useState(0)

  // New object on every render
  const style = { color: "blue", fontSize: 16 }

  // New function on every render
  const handleClick = () => console.log("clicked")

  return <ChildComponent style={style} onClick={handleClick} />
}
```

### useMemo: Memoizing Expensive Calculations

`useMemo` caches the result of expensive calculations.

```tsx
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b)
}, [a, b])
```

**When to Use useMemo:**

- Expensive computations (filtering large arrays, complex transformations)
- Preserving referential equality for objects passed as props
- Preventing unnecessary re-renders in optimized child components

### useCallback: Memoizing Functions

`useCallback` returns a memoized version of a function.

```tsx
const memoizedCallback = useCallback(() => {
  doSomething(a, b)
}, [a, b])
```

**When to Use useCallback:**

- Functions passed as props to optimized child components
- Functions used as dependencies in other hooks
- Preventing unnecessary effect re-runs

### Strategic Memoization

Memoization should be used strategically, not indiscriminately. The goal is to break render cascades, not optimize individual calculations.

```tsx
// ❌ Unnecessary memoization
const simpleValue = useMemo(() => a + b, [a, b])

// ✅ Strategic memoization
const expensiveList = useMemo(() => {
  return largeArray.filter((item) => item.matches(criteria))
}, [largeArray, criteria])
```

## Custom Hooks: The Art of Abstraction

Custom hooks are the most powerful feature of the Hooks paradigm, enabling the creation of reusable logic abstractions.

### Design Principles

1. **Single Responsibility**: Each hook should do one thing well
2. **Clear API**: Simple, predictable inputs and outputs
3. **Descriptive Naming**: Names should clearly communicate purpose
4. **Comprehensive Documentation**: Clear usage examples and edge cases

### Composition Over Monoliths

Instead of creating monolithic hooks, compose smaller, focused hooks:

```tsx
// ❌ Monolithic hook
function useUserData(userId) {
  // Handles fetching, caching, real-time updates, error handling
  // 200+ lines of code
}

// ✅ Composed hooks
function useUserData(userId) {
  const { data, error, isLoading } = useFetch(`/api/users/${userId}`)
  const cachedData = useCache(data, `user-${userId}`)
  const realTimeUpdates = useSubscription(`user-${userId}`)

  return {
    user: realTimeUpdates || cachedData,
    error,
    isLoading,
  }
}
```

## Practical Implementations: Production-Ready Custom Hooks

This section presents comprehensive implementations of common custom hooks, each with detailed problem analysis, edge case handling, and architectural considerations.

### 1. usePrevious: Tracking State Transitions

**Problem Statement**: In React's functional components, there's no built-in way to access the previous value of a state or prop. This is needed for comparisons, animations, and detecting changes.

**Key Questions to Consider**:

- How do we handle the initial render when there's no previous value?
- What happens if the value is `undefined` or `null`?
- How do we ensure the hook works correctly with multiple state variables?
- Should we support deep equality comparison for objects?

**Edge Cases and Solutions**:

1. **Initial Render**: Return `undefined` to indicate no previous value
2. **Reference Equality**: Use `useRef` to store the previous value outside the render cycle
3. **Effect Timing**: Use `useEffect` to update the ref after render, ensuring we return the previous value during the current render
4. **Multiple States**: The hook remains stable regardless of other state variables due to dependency array scoping

**Production Implementation**:

````tsx
import { useEffect, useRef } from "react"

/**
 * Tracks the previous value of a state or prop.
 *
 * @param value - The current value to track
 * @returns The previous value, or undefined on first render
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const previousCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {previousCount ?? 'None'}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
````

**Food for Thought**:

- **Performance**: Could we avoid the `useEffect` by updating the ref directly in the render function? What are the trade-offs?
- **Concurrent Mode**: How does this hook behave in React's concurrent features?
- **Alternative Patterns**: Could we implement this using a reducer pattern for more complex state tracking?
- **Type Safety**: How can we improve TypeScript inference for the return type?

**Advanced Variant with Deep Comparison**:

```tsx
import { useEffect, useRef, useMemo } from "react"

interface UsePreviousOptions {
  deep?: boolean
  compare?: (prev: any, current: any) => boolean
}

export function usePrevious<T>(value: T, options: UsePreviousOptions = {}): T | undefined {
  const { deep = false, compare } = options
  const ref = useRef<T>()

  const shouldUpdate = useMemo(() => {
    if (compare) return !compare(ref.current, value)
    if (deep) return JSON.stringify(ref.current) !== JSON.stringify(value)
    return ref.current !== value
  }, [value, deep, compare])

  useEffect(() => {
    if (shouldUpdate) {
      ref.current = value
    }
  }, [value, shouldUpdate])

  return ref.current
}
```

### 2. useDebounce: Stabilizing Rapid Updates

**Problem Statement**: User input events (like typing in a search box) can fire rapidly, causing performance issues and unnecessary API calls. We need to delay the processing until the user stops typing.

**Key Questions to Consider**:

- Should we support both leading and trailing edge execution?
- How do we handle rapid changes to the delay parameter?
- What happens if the component unmounts while a timer is pending?
- Should we provide a way to cancel or flush the debounced value?

**Edge Cases and Solutions**:

1. **Component Unmounting**: Clear the timer in the cleanup function to prevent memory leaks
2. **Delay Changes**: Include delay in the dependency array to restart the timer when it changes
3. **Rapid Value Changes**: Each new value cancels the previous timer and starts a new one
4. **Initial Value**: Start with the current value to avoid undefined states

**Production Implementation**:

````tsx collapse={1-31}
import { useState, useEffect, useRef } from "react"

/**
 * Debounces a value, updating it only after a specified delay has passed.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       performSearch(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 *
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="Search..."
 *     />
 *   );
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear the previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set a new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}
````

**Food for Thought**:

- **Leading Edge**: Should we execute immediately on the first call? How would this affect UX?
- **Throttling vs Debouncing**: When would you choose one over the other?
- **Memory Management**: Are there any edge cases where timers might not be properly cleaned up?
- **Performance**: Could we optimize this further by avoiding the state update if the value hasn't changed?

**Advanced Variant with Callback Control**:

```tsx collapse={1-12,41-54}
import { useCallback, useRef } from "react"

interface UseDebounceCallbackOptions {
  leading?: boolean
  trailing?: boolean
}

export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: UseDebounceCallbackOptions = {},
): [T, () => void, () => void] {
  const { leading = false, trailing = true } = options
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastCallTimeRef = useRef<number>()
  const lastArgsRef = useRef<Parameters<T>>()

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      lastArgsRef.current = args

      if (leading && (!lastCallTimeRef.current || now - lastCallTimeRef.current >= delay)) {
        lastCallTimeRef.current = now
        callback(...args)
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          lastCallTimeRef.current = Date.now()
          callback(...lastArgsRef.current!)
        }, delay)
      }
    },
    [callback, delay, leading, trailing],
  )

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const flush = useCallback(() => {
    if (timeoutRef.current && lastArgsRef.current) {
      clearTimeout(timeoutRef.current)
      callback(...lastArgsRef.current)
    }
  }, [callback])

  return [debouncedCallback, cancel, flush]
}
```

### 3. useFetch: Robust Data Fetching with AbortController

**Problem Statement**: Data fetching in React components needs to handle loading states, errors, request cancellation, and race conditions. A naive implementation can lead to memory leaks and stale UI updates.

**Key Questions to Consider**:

- How do we prevent setting state on unmounted components?
- How do we handle race conditions when multiple requests are in flight?
- Should we implement caching to avoid duplicate requests?
- How do we handle different types of errors (network, HTTP, parsing)?

**Edge Cases and Solutions**:

1. **Component Unmounting**: Use AbortController to cancel in-flight requests
2. **Race Conditions**: Cancel previous requests when a new one starts
3. **Error Handling**: Distinguish between abort errors and genuine failures
4. **State Management**: Use reducer pattern for complex state transitions
5. **Request Deduplication**: Implement request caching to avoid duplicate calls

**Production Implementation**:

````tsx collapse={20-53,57-83}
import { useEffect, useReducer, useRef, useCallback } from "react"

// State interface
interface FetchState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
}

// Action types
type FetchAction<T> =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: T }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "FETCH_RESET" }

// Reducer function
function fetchReducer<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T> {
  switch (action.type) {
    case "FETCH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
        isSuccess: false,
      }
    case "FETCH_SUCCESS":
      return {
        ...state,
        data: action.payload,
        isLoading: false,
        error: null,
        isSuccess: true,
      }
    case "FETCH_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isSuccess: false,
      }
    case "FETCH_RESET":
      return {
        data: null,
        error: null,
        isLoading: false,
        isSuccess: false,
      }
    default:
      return state
  }
}

// Request cache for deduplication
const requestCache = new Map<string, Promise<any>>()

/**
 * A robust data fetching hook with request cancellation and caching.
 *
 * @param url - The URL to fetch from
 * @param options - Fetch options and hook configuration
 * @returns Fetch state and control functions
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const { data, error, isLoading, refetch } = useFetch(
 *     `https://api.example.com/users/${userId}`,
 *     {
 *       enabled: !!userId,
 *       cacheTime: 5 * 1000 // 5 minutes
 *     }
 *   );
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *   if (!data) return null;
 *
 *   return <UserCard user={data} />;
 * }
 * ```
 */
export function useFetch<T = any>(
  url: string | null,
  options: {
    enabled?: boolean
    cacheTime?: number
    headers?: Record<string, string>
    method?: string
    body?: any
  } = {},
): FetchState<T> & {
  refetch: () => void
  reset: () => void
} {
  const { enabled = true, cacheTime = 0, headers = {}, method = "GET", body } = options

  const [state, dispatch] = useReducer(fetchReducer<T>, {
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
  })

  const abortControllerRef = useRef<AbortController>()
  const cacheKey = useRef<string>()

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return

    // Create cache key
    const key = `${method}:${url}:${JSON.stringify(body)}`
    cacheKey.current = key

    // Check cache first
    if (requestCache.has(key)) {
      try {
        const cachedData = await requestCache.get(key)
        dispatch({ type: "FETCH_SUCCESS", payload: cachedData })
        return
      } catch (error) {
        // Cache hit but request failed, continue with fresh request
      }
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    dispatch({ type: "FETCH_START" })

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
      }

      if (body && method !== "GET") {
        fetchOptions.body = JSON.stringify(body)
      }

      const promise = fetch(url, fetchOptions).then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })

      // Cache the promise
      requestCache.set(key, promise)

      const data = await promise

      // Only update state if this is still the current request
      if (cacheKey.current === key) {
        dispatch({ type: "FETCH_SUCCESS", payload: data })
      }

      // Remove from cache after cache time
      if (cacheTime > 0) {
        setTimeout(() => {
          requestCache.delete(key)
        }, cacheTime)
      }
    } catch (error) {
      // Only update state if this is still the current request and not an abort
      if (cacheKey.current === key && error.name !== "AbortError") {
        dispatch({ type: "FETCH_ERROR", payload: error as Error })
      }
    }
  }, [url, enabled, method, body, headers, cacheTime])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  const reset = useCallback(() => {
    dispatch({ type: "FETCH_RESET" })
  }, [])

  useEffect(() => {
    fetchData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  return {
    ...state,
    refetch,
    reset,
  }
}
````

**Food for Thought**:

- **Cache Strategy**: Should we implement different caching strategies (LRU, TTL, etc.)?
- **Retry Logic**: How would you implement automatic retry with exponential backoff?
- **Request Deduplication**: Could we use a more sophisticated deduplication strategy?
- **Error Boundaries**: How does this hook integrate with React's error boundary system?
- **Suspense Integration**: Could we modify this to work with React Suspense for data fetching?

### 4. useLocalStorage: Persistent State Management

**Problem Statement**: We need to persist component state across browser sessions while handling storage errors, serialization, and synchronization between tabs.

**Key Questions to Consider**:

- How do we handle storage quota exceeded errors?
- Should we support custom serialization/deserialization?
- How do we handle storage events from other tabs?
- What happens if localStorage is not available (private browsing)?

**Edge Cases and Solutions**:

1. **Storage Unavailable**: Gracefully fall back to in-memory state
2. **Serialization Errors**: Handle JSON parsing errors and provide fallback values
3. **Storage Events**: Listen for changes from other tabs and update state accordingly
4. **Quota Exceeded**: Catch and handle storage quota errors
5. **Type Safety**: Ensure TypeScript types match the stored data

**Production Implementation**:

````tsx collapse={1-30,64-82}
import { useState, useEffect, useCallback, useRef } from "react"

interface UseLocalStorageOptions<T> {
  defaultValue?: T
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
  onError?: (error: Error) => void
}

/**
 * Manages state that persists in localStorage with error handling and cross-tab synchronization.
 *
 * @param key - The localStorage key
 * @param initialValue - The initial value if no stored value exists
 * @param options - Configuration options
 * @returns [value, setValue, removeValue]
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 *   return (
 *     <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const { defaultValue, serializer = JSON.stringify, deserializer = JSON.parse, onError = console.error } = options

  // Use ref to track if we're in the middle of a setState operation
  const isSettingRef = useRef(false)

  // Get stored value or fall back to initial value
  const getStoredValue = useCallback((): T => {
    try {
      if (typeof window === "undefined") {
        return initialValue
      }

      const item = window.localStorage.getItem(key)
      if (item === null) {
        return defaultValue ?? initialValue
      }

      return deserializer(item)
    } catch (error) {
      onError(error as Error)
      return defaultValue ?? initialValue
    }
  }, [key, initialValue, defaultValue, deserializer, onError])

  const [storedValue, setStoredValue] = useState<T>(getStoredValue)

  // Set value function
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        isSettingRef.current = true

        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value

        // Save to state
        setStoredValue(valueToStore)

        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serializer(valueToStore))
        }
      } catch (error) {
        onError(error as Error)
      } finally {
        isSettingRef.current = false
      }
    },
    [key, storedValue, serializer, onError],
  )

  // Remove value function
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      onError(error as Error)
    }
  }, [key, initialValue, onError])

  // Listen for changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && !isSettingRef.current) {
        try {
          const newValue = e.newValue === null ? (defaultValue ?? initialValue) : deserializer(e.newValue)
          setStoredValue(newValue)
        } catch (error) {
          onError(error as Error)
        }
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange)
      return () => window.removeEventListener("storage", handleStorageChange)
    }
  }, [key, defaultValue, initialValue, deserializer, onError])

  return [storedValue, setValue, removeValue]
}
````

**Food for Thought**:

- **Encryption**: How would you implement encryption for sensitive data?
- **Compression**: Could we compress large objects before storing them?
- **Validation**: Should we add schema validation for stored data?
- **Migration**: How would you handle schema changes in stored data?
- **Performance**: Could we debounce storage writes for frequently changing values?

### 5. useIntersectionObserver: Efficient Element Visibility Detection

**Problem Statement**: We need to detect when elements enter or leave the viewport for lazy loading, infinite scrolling, and performance optimizations. Traditional scroll event listeners are inefficient and can cause performance issues.

**Key Questions to Consider**:

- How do we handle multiple elements with the same observer?
- Should we support different threshold values?
- How do we handle observer cleanup and memory management?
- What happens if the IntersectionObserver API is not supported?

**Edge Cases and Solutions**:

1. **Browser Support**: Provide fallback for older browsers
2. **Observer Reuse**: Use a single observer for multiple elements when possible
3. **Memory Leaks**: Properly disconnect observers when components unmount
4. **Threshold Variations**: Support different threshold values for different use cases
5. **Performance**: Avoid unnecessary re-renders when intersection state changes

**Production Implementation**:

````tsx collapse={1-40}
import { useEffect, useRef, useState, useCallback } from "react"

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

interface IntersectionObserverEntry {
  isIntersecting: boolean
  intersectionRatio: number
  target: Element
}

/**
 * Detects when an element enters or leaves the viewport using IntersectionObserver.
 *
 * @param options - IntersectionObserver configuration
 * @returns [ref, isIntersecting, entry]
 *
 * @example
 * ```tsx
 * function LazyImage({ src, alt }) {
 *   const [ref, isIntersecting] = useIntersectionObserver({
 *     threshold: 0.1,
 *     freezeOnceVisible: true
 *   });
 *
 *   return (
 *     <img
 *       ref={ref}
 *       src={isIntersecting ? src : ''}
 *       alt={alt}
 *       loading="lazy"
 *     />
 *   );
 * }
 * ```
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
): [(node: Element | null) => void, boolean, IntersectionObserverEntry | null] {
  const { threshold = 0, root = null, rootMargin = "0px", freezeOnceVisible = false } = options

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  const elementRef = useRef<Element | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const frozenRef = useRef(false)

  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
  }, [])

  const setRef = useCallback(
    (node: Element | null) => {
      // Disconnect previous observer
      disconnect()

      elementRef.current = node

      if (!node) {
        setEntry(null)
        setIsIntersecting(false)
        return
      }

      // Check if IntersectionObserver is supported
      if (!("IntersectionObserver" in window)) {
        // Fallback: assume element is visible
        setEntry({
          isIntersecting: true,
          intersectionRatio: 1,
          target: node,
        })
        setIsIntersecting(true)
        return
      }

      // Create new observer
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const isVisible = entry.isIntersecting

          // Freeze if requested and element becomes visible
          if (freezeOnceVisible && isVisible) {
            frozenRef.current = true
          }

          // Only update if not frozen
          if (!frozenRef.current) {
            setEntry(entry)
            setIsIntersecting(isVisible)
          }
        },
        {
          threshold,
          root,
          rootMargin,
        },
      )

      // Start observing
      observerRef.current.observe(node)
    },
    [threshold, root, rootMargin, freezeOnceVisible, disconnect],
  )

  // Cleanup on unmount
  useEffect(() => {
    return disconnect
  }, [disconnect])

  return [setRef, isIntersecting, entry]
}
````

**Food for Thought**:

- **Observer Pooling**: Could we implement a pool of observers to reduce memory usage?
- **Virtual Scrolling**: How would this integrate with virtual scrolling libraries?
- **Performance Monitoring**: Should we track intersection performance metrics?
- **Accessibility**: How does this affect screen reader behavior?
- **Mobile Optimization**: Should we use different thresholds for mobile devices?

### 6. useThrottle: Rate Limiting Function Calls

**Problem Statement**: We need to limit the rate at which a function can be called, ensuring it executes at most once per specified time interval. This is useful for scroll handlers, resize listeners, and other high-frequency events.

**Key Questions to Consider**:

- Should we support both leading and trailing execution?
- How do we handle the last call in a burst of calls?
- What happens if the throttled function returns a promise?
- Should we provide a way to cancel pending executions?

**Edge Cases and Solutions**:

1. **Leading vs Trailing**: Support both immediate and delayed execution patterns
2. **Last Call Handling**: Ensure the last call in a burst is executed
3. **Promise Support**: Handle async functions properly
4. **Cancellation**: Provide a way to cancel pending executions
5. **Memory Management**: Clean up timers and references properly

**Production Implementation**:

````tsx collapse={1-35}
import { useCallback, useRef } from "react"

interface UseThrottleOptions {
  leading?: boolean
  trailing?: boolean
}

/**
 * Throttles a function, ensuring it executes at most once per specified interval.
 *
 * @param callback - The function to throttle
 * @param delay - The throttle delay in milliseconds
 * @param options - Throttle configuration
 * @returns [throttledCallback, cancel, flush]
 *
 * @example
 * ```tsx
 * function ScrollTracker() {
 *   const [scrollY, setScrollY] = useState(0);
 *
 *   const throttledSetScrollY = useThrottle(setScrollY, 100);
 *
 *   useEffect(() => {
 *     const handleScroll = () => {
 *       throttledSetScrollY(window.scrollY);
 *     };
 *
 *     window.addEventListener('scroll', handleScroll);
 *     return () => window.removeEventListener('scroll', handleScroll);
 *   }, [throttledSetScrollY]);
 *
 *   return <div>Scroll position: {scrollY}</div>;
 * }
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: UseThrottleOptions = {},
): [T, () => void, () => void] {
  const { leading = true, trailing = true } = options

  const lastCallTimeRef = useRef<number>(0)
  const lastCallArgsRef = useRef<Parameters<T>>()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastExecTimeRef = useRef<number>(0)

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      lastCallArgsRef.current = args

      // Check if enough time has passed since last execution
      const timeSinceLastExec = now - lastExecTimeRef.current

      if (timeSinceLastExec >= delay) {
        // Execute immediately
        if (leading) {
          lastExecTimeRef.current = now
          callback(...args)
        }

        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = undefined
        }
      } else if (trailing && !timeoutRef.current) {
        // Schedule execution for later
        const remainingTime = delay - timeSinceLastExec

        timeoutRef.current = setTimeout(() => {
          if (lastCallArgsRef.current) {
            lastExecTimeRef.current = Date.now()
            callback(...lastCallArgsRef.current)
          }
          timeoutRef.current = undefined
        }, remainingTime)
      }
    },
    [callback, delay, leading, trailing],
  )

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    lastCallArgsRef.current = undefined
  }, [])

  const flush = useCallback(() => {
    if (timeoutRef.current && lastCallArgsRef.current) {
      clearTimeout(timeoutRef.current)
      lastExecTimeRef.current = Date.now()
      callback(...lastCallArgsRef.current)
      timeoutRef.current = undefined
    }
  }, [callback])

  return [throttledCallback, cancel, flush]
}
````

**Food for Thought**:

- **Debounce vs Throttle**: When would you choose one over the other?
- **Performance**: Could we optimize this further by avoiding function recreation?
- **Edge Cases**: What happens with very small delay values?
- **Testing**: How would you unit test this hook effectively?
- **Composition**: Could we combine this with other hooks for more complex patterns?

## Advanced Patterns and Compositions

### Hook Composition: Building Complex Abstractions

The true power of custom hooks lies in their ability to compose into more complex abstractions.

```tsx
// Example: Composed data fetching with caching and real-time updates
function useUserProfile(userId: string) {
  const { data: user, error, isLoading, refetch } = useFetch(`/api/users/${userId}`, { cacheTime: 5 * 60 * 1000 })

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

  return {
    user,
    error,
    isLoading,
    isOnline,
    isVisible,
    ref,
    refetch,
  }
}
```

### Performance Optimization Patterns

```tsx
// Example: Optimized list rendering with virtualization
function useVirtualizedList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)
  const throttledSetScrollTop = useThrottle(setScrollTop, 16) // 60fps

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, items.length)
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])

  return {
    visibleItems,
    visibleRange,
    totalHeight: items.length * itemHeight,
    onScroll: throttledSetScrollTop,
  }
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

**Problem Statement**: In server-rendered applications, generating unique IDs can cause hydration mismatches between server and client. We need stable, unique identifiers that work consistently across renders and environments.

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

**Problem Statement**: React needs a way to consume promises and context values in a way that integrates with Suspense and concurrent features. The `use` hook provides a unified API for consuming both promises and context.

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

**Advanced Patterns with use**:

```tsx
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

**Problem Statement**: Sometimes we need to perform DOM measurements and updates synchronously before the browser paints. `useLayoutEffect` runs synchronously after all DOM mutations but before the browser repaints.

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

**Problem Statement**: React components need to subscribe to external state stores (like Redux, Zustand, or browser APIs) and re-render when that state changes. `useSyncExternalStore` provides a way to safely subscribe to external data sources.

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

```tsx
import { useSyncExternalStore } from "react"

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

**Food for Thought**:

- **Server-Side Rendering**: How does `useSyncExternalStore` handle SSR?
- **Performance**: What's the performance impact of subscribing to external stores?
- **Memory Leaks**: How do we prevent memory leaks with external subscriptions?
- **Selective Updates**: When should we use selectors vs subscribing to the entire store?

### useInsertionEffect: CSS-in-JS and Style Injection

**Problem Statement**: CSS-in-JS libraries need to inject styles into the DOM before other effects run. `useInsertionEffect` runs synchronously before all other effects, making it perfect for style injection.

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

**Problem Statement**: Sometimes we need to defer expensive updates to prevent blocking the UI. `useDeferredValue` allows us to defer updates to non-critical values while keeping the UI responsive.

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

**Problem Statement**: We need to manage loading states for non-urgent updates without blocking the UI. `useTransition` allows us to mark updates as non-urgent and track their loading state.

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
