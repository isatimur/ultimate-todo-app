import { POST } from '@/app/api/ai/daily-summary/route'
import { sendEmail } from '@/lib/email'

jest.mock('openai', () => {
  return {
    OpenAI: function () {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Mock summary' } }]
            })
          }
        }
      }
    }
  }
})

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true })
}))

describe('daily summary API', () => {
  it('returns a summary for provided tasks', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        tasks: [
          { title: 'Task 1', status: 'done' },
          { title: 'Task 2', status: 'open' }
        ],
        email: 'user@example.com'
      })
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.summary).toBe('Mock summary')
    expect(sendEmail).toHaveBeenCalled()
  })
})
