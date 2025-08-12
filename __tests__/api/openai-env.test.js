describe('openai env validation', () => {
  const originalKey = process.env.OPENAI_API_KEY

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.OPENAI_API_KEY = originalKey
    } else {
      delete process.env.OPENAI_API_KEY
    }
    jest.resetModules()
  })

  it('throws if OPENAI_API_KEY is missing', () => {
    delete process.env.OPENAI_API_KEY
    jest.resetModules()
    expect(() => require('../../lib/openai')).toThrow('OPENAI_API_KEY is not set')
  })
})
