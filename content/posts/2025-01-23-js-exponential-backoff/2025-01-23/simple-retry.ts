type AsyncFunction<T> = () => Promise<T>
async function retryAsync<T>(fn: AsyncFunction<T>, retries: number): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... attempts left: ${retries}`)
      return retryAsync(fn, retries - 1)
    } else {
      throw error
    }
  }
}
