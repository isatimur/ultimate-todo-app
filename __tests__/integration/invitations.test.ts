import { inviteUserToTeam } from '@/features/inviteUser'
import { vi } from 'vitest'

describe('Invitations', () => {
  it('calls the invitation API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    // @ts-ignore
    global.fetch = mockFetch

    await inviteUserToTeam(7, 'test@example.com')

    expect(mockFetch).toHaveBeenCalledWith('/api/teams/7/invite', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    }))
  })
})
