function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
async function retryAsyncWithWait<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... attempts left: ${retries}`)
      await wait(delay)
      return retryAsyncWithWait(fn, retries - 1, delay)
    } else {
      throw error
    }
  }
}
