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
      throw new Error('Queue is empty')
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
