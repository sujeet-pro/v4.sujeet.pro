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

// Queue implementation using a linked list
class TaskNode<T> {
  value: T
  next: TaskNode<T> | null
  constructor(value: T) {
    this.value = value
    this.next = null
  }
}

export class TaskQueue<T> {
  head: TaskNode<T> | null
  tail: TaskNode<T> | null
  size: number
  constructor() {
    this.head = null
    this.tail = null
    this.size = 0
  }

  // Enqueue: Add an element to the end of the queue
  enqueue(value: T) {
    const newNode = new TaskNode(value)
    if (this.tail) {
      this.tail.next = newNode
    }
    this.tail = newNode
    if (!this.head) {
      this.head = newNode
    }
    this.size++
  }

  // Dequeue: Remove an element from the front of the queue
  dequeue(): T {
    if (!this.head) {
      throw new Error("Queue is empty")
    }
    const value = this.head.value
    this.head = this.head.next
    if (!this.head) {
      this.tail = null
    }
    this.size--
    return value
  }

  isEmpty() {
    return this.size === 0
  }
}

// Example usage
const queue = new AsyncTaskQueue(3)

const createTask = (id: number, delay: number) => () =>
  new Promise<void>((resolve) => {
    console.log(`Task ${id} started`)
    setTimeout(() => {
      console.log(`Task ${id} completed`)
      resolve()
    }, delay)
  })

queue.addTask(createTask(1, 1000))
queue.addTask(createTask(2, 500))
queue.addTask(createTask(3, 1500))
queue.addTask(createTask(4, 200))
queue.addTask(createTask(5, 300))
