import { POST } from '@/app/api/ai/project-planner/route'

jest.mock('openai', () => {
  return {
    OpenAI: function () {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      tasks: [
                        { title: 'Plan party', tasks: [{ title: 'Send invites' }] }
                      ]
                    })
                  }
                }
              ]
            })
          }
        }
      }
    }
  }
})

describe('project planner API', () => {
  it('returns nested tasks for a goal', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ goal: 'Birthday party' })
    })

    const res = await POST(req)
    const json = await res.json()

    expect(json.tasks[0].tasks[0].title).toBe('Send invites')
  })
})
