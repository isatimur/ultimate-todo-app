import React from 'react'
import { render } from '@testing-library/react'
import { CalendarPageClient } from '@/components/calendar-page-client'
import { toast } from 'sonner'

// Mock CalendarView to capture props
const calendarViewMock = jest.fn(() => null)
jest.mock('@/components/calendar-view', () => ({
  CalendarView: (props) => {
    calendarViewMock(props)
    return null
  },
}))

// Mock the Zustand store
const useStoreMock = jest.fn()
const mockAddTask = jest.fn()
const mockUpdateTask = jest.fn()
const mockDeleteTask = jest.fn()
const mockFetchTasks = jest.fn().mockResolvedValue(undefined)
const mockFetchProjects = jest.fn().mockResolvedValue(undefined)

jest.mock('@/store', () => ({
  useStore: () => useStoreMock(),
}))

// Mock toast utilities
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

describe('CalendarPageClient', () => {
  beforeEach(() => {
    useStoreMock.mockReturnValue({
      tasks: [],
      projects: [],
      isLoading: false,
      fetchTasks: mockFetchTasks,
      fetchProjects: mockFetchProjects,
      addTask: mockAddTask,
      updateTask: mockUpdateTask,
      deleteTask: mockDeleteTask,
    })
    calendarViewMock.mockClear()
    mockAddTask.mockReset()
    mockUpdateTask.mockReset()
    mockDeleteTask.mockReset()
    ;(toast.error as jest.Mock).mockClear()
  })

  it('shows toast when adding a task fails', async () => {
    mockAddTask.mockResolvedValue(null)
    render(<CalendarPageClient />)
    const props = calendarViewMock.mock.calls[0][0]
    await props.onAddTask({})
    expect(toast.error).toHaveBeenCalledWith('Failed to create task')
  })

  it('shows toast when updating a task fails', async () => {
    mockUpdateTask.mockResolvedValue(null)
    render(<CalendarPageClient />)
    const props = calendarViewMock.mock.calls[0][0]
    await props.onTaskUpdate('1', {})
    expect(toast.error).toHaveBeenCalledWith('Failed to update task')
  })

  it('shows toast when deleting a task fails', async () => {
    mockDeleteTask.mockRejectedValue(new Error('oops'))
    render(<CalendarPageClient />)
    const props = calendarViewMock.mock.calls[0][0]
    await props.onTaskDelete('1')
    expect(toast.error).toHaveBeenCalledWith('Failed to delete task')
  })
})
