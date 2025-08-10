import { vi } from 'vitest'

vi.mock('@/lib/supabase-browser', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '@/lib/supabase-browser'
import { TaskService } from '@/lib/services/tasks'

describe('Task CRUD', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates a task', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    ;(supabase.from as any).mockReturnValueOnce({ insert })

    const task = await TaskService.createTask({ title: 'T', status: 'todo', priority: 'low' } as any, 'user')

    expect(insert).toHaveBeenCalled()
    expect(task.id).toBe(1)
  })

  it('updates a task', async () => {
    const verifySingle = vi.fn().mockResolvedValue({ data: { user_id: 'user' }, error: null })
    const verifyEq = vi.fn().mockReturnValue({ single: verifySingle })
    const verifySelect = vi.fn().mockReturnValue({ eq: verifyEq })

    const updateSingle = vi.fn().mockResolvedValue({ data: { id: 1, title: 'Updated' }, error: null })
    const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
    const updateEq = vi.fn().mockReturnValue({ select: updateSelect })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    ;(supabase.from as any)
      .mockReturnValueOnce({ select: verifySelect })
      .mockReturnValueOnce({ update })

    const result = await TaskService.updateTask(1, { title: 'Updated' } as any, 'user')

    expect(update).toHaveBeenCalled()
    expect(result.title).toBe('Updated')
  })

  it('deletes a task', async () => {
    const verifySingle = vi.fn().mockResolvedValue({ data: { user_id: 'user' }, error: null })
    const verifyEq = vi.fn().mockReturnValue({ single: verifySingle })
    const verifySelect = vi.fn().mockReturnValue({ eq: verifyEq })

    const deleteEq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq: deleteEq })

    ;(supabase.from as any)
      .mockReturnValueOnce({ select: verifySelect })
      .mockReturnValueOnce({ delete: del })

    await TaskService.deleteTask(1, 'user')

    expect(del).toHaveBeenCalled()
  })
})
