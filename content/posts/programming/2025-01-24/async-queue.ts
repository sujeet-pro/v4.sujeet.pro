import { TaskQueue } from './task-queue'

type Task<T = void> = () => Promise<T>

export class AsyncTaskQueue {
  private queue = new TaskQueue<Task>()
  private activeCount = 0
  private concurrencyLimit: number

  constructor(concurrencyLimit: number) {
    this.concurrencyLimit = concurrencyLimit
  }

  addTask<T>(promiseFactory: Task<T>): Promise<T> {
    const { promise, resolve, reject } = Promise.withResolvers<T>()
    const task: Task = async () => {
      try {
        const result = await promiseFactory()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    this.queue.enqueue(task)
    this.processQueue()
    return promise
  }

  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.concurrencyLimit || this.queue.isEmpty()) {
      return
    }

    const task = this.queue.dequeue()
    if (task) {
      this.activeCount++
      try {
        await task()
      } finally {
        this.activeCount--
        this.processQueue()
      }
    }
  }
}
