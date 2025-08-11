import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase-server', () => ({
  createClient: vi.fn()
}))

import { createClient } from '@/lib/supabase-server'
import {
  ApiError,
  getAuthenticatedUser,
  verifyTaskOwnership
} from '../app/api/tasks/taskUtils'

describe('getAuthenticatedUser', () => {
  it('returns user when authenticated', async () => {
    const mockUser = { id: 'user123' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
      }
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    const result = await getAuthenticatedUser()
    expect(result.user).toEqual(mockUser)
    expect(result.supabase).toBe(mockSupabase)
  })

  it('throws ApiError when unauthenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } })
      }
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)

    await expect(getAuthenticatedUser()).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401
    })
  })
})

describe('verifyTaskOwnership', () => {
  const userId = 'user123'

  it('does nothing when user owns task', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: userId },
          error: null
        })
      })
    }

    await expect(
      verifyTaskOwnership(supabase as any, 'task1', userId)
    ).resolves.toBeUndefined()
  })

  it('throws ApiError if task not found', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('not found')
        })
      })
    }

    await expect(
      verifyTaskOwnership(supabase as any, 'task1', userId)
    ).rejects.toMatchObject({ status: 404 })
  })

  it('throws ApiError if user is not owner', async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { user_id: 'other' },
          error: null
        })
      })
    }

    await expect(
      verifyTaskOwnership(supabase as any, 'task1', userId)
    ).rejects.toMatchObject({ status: 403 })
  })
})

