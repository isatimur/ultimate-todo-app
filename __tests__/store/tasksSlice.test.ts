import { create } from 'zustand'
import { vi, describe, it, expect } from 'vitest'
import type { TasksSlice } from '../../store/tasksSlice'
import { createTasksSlice } from '../../store/tasksSlice'

var eqMock: any

vi.mock('@/lib/supabase-browser', () => {
  eqMock = vi.fn()
  return {
    supabase: {
      from: () => ({
        delete: () => ({ eq: eqMock }),
      }),
    },
  }
})

describe('tasksSlice deleteTask', () => {
  it('returns false when deletion fails', async () => {
    eqMock.mockResolvedValueOnce({ error: new Error('fail') })
    const useTasks = create<TasksSlice>()(createTasksSlice)
    const result = await useTasks.getState().deleteTask('1')
    expect(result).toBe(false)
  })
})
