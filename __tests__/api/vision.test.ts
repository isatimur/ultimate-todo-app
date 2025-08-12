import { POST } from '@/app/api/vision/route'

jest.mock('openai', () => ({
  __esModule: true,
  default: function () {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              { message: { content: 'Buy milk' } }
            ]
          })
        }
      }
    }
  }
}))

describe('vision API', () => {
  it('extracts text from image', async () => {
    const blob = new Blob(['fake'], { type: 'image/png' })
    const formData = new FormData()
    formData.append('image', blob)

    const req = new Request('http://localhost', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req)
    const json = await res.json()
    expect(json.text).toBe('Buy milk')
  })
})
