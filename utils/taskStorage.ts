import { Task } from '@/lib/types'

const STORAGE_KEY = 'tasks'

export const getTasks = (): Task[] => {
  const tasksJson = localStorage.getItem(STORAGE_KEY)
  return tasksJson ? JSON.parse(tasksJson) : []
}

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export const addTask = (task: Task): void => {
  const tasks = getTasks()
  tasks.push(task)
  saveTasks(tasks)
}

export const updateTask = (updatedTask: Task): void => {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === updatedTask.id)
  if (index !== -1) {
    tasks[index] = updatedTask
    saveTasks(tasks)
  }
}

export const deleteTask = (taskId: string): void => {
  const tasks = getTasks()
  const updatedTasks = tasks.filter(t => t.id !== taskId)
  saveTasks(updatedTasks)
}

