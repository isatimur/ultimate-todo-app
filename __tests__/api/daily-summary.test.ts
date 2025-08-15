import { POST } from '@/app/api/ai/daily-summary/route'

jest.mock('openai', () => {
  return {
    OpenAI: function () {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                { message: { content: 'You have 1 task today' } }
              ]
            })
          }
        }
      }
    }
  }
})

jest.mock('@/lib/supabase-server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: '123', email: 'test@example.com' } } })
    }
  })
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true })
}))

describe('daily summary API', () => {
  it('returns a summary for provided tasks', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ tasks: [{ title: 'Test Task', status: 'To Do', due_date: new Date().toISOString() }] })
    })
    const res = await POST(req as any)
    const json = await res.json()
    expect(json.summary).toBe('You have 1 task today')
  })
})
