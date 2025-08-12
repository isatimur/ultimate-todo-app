import { POST } from '@/app/api/daily-summary/route'

const mockSendEmail = jest.fn()

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve({
    get: () => undefined,
    set: () => {},
    delete: () => {}
  }))
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com', user_metadata: { daily_digest: false } } },
        error: null
      })
    }
  }))
}))

jest.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail
}))

describe('daily summary API', () => {
  it('skips sending email when the flag is off', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'

    const req = new Request('http://localhost', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(json.skipped).toBe(true)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})

