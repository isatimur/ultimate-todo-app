import aiSuggestion from '@/app/api/[[...route]]/aiSuggestion';

const mockCreate = jest.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: 'Use a planner',
      },
    },
  ],
});

jest.mock('openai', () => {
  return {
    OpenAI: function () {
      return {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      };
    },
  };
});

describe('aiSuggestion API', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('returns a suggestion when tasks are provided', async () => {
    const res = await aiSuggestion.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: ['Task 1'] }),
    });

    const json = await res.json();
    expect(json.suggestion).toBe('Use a planner');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('returns a message when no tasks for today', async () => {
    const res = await aiSuggestion.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: [] }),
    });

    const json = await res.json();
    expect(json.message).toBe('No tasks for today');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
