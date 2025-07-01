import { AsyncTaskQueue } from './async-queue'

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
