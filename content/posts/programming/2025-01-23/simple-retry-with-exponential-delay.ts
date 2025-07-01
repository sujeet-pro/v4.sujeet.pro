function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
export async function exponentialBackoffRetryRecursive<T>(
  asyncFunction: () => Promise<T>,
  retries: number,
  delay: number,
  attempt: number = 0
): Promise<T> {
  try {
    return await asyncFunction()
  } catch (error) {
    if (attempt >= retries) {
      throw error
    }
    await wait(delay * Math.pow(2, attempt))
    return exponentialBackoffRetryRecursive(asyncFunction, retries, delay, attempt + 1)
  }
}
