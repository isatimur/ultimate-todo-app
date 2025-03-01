import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json()

    const prompt = `Break down the following task into 3-5 clear and actionable subtasks:

Task Title: "${title}"
${description ? `Task Description: "${description}"` : ''}

Each subtask should:
1. Be a specific, actionable item
2. Follow a logical sequence
3. Be achievable in a reasonable timeframe
4. Include clear success criteria

Format the response as a JSON array of objects with 'title' properties.
Example: [{"title": "Research existing solutions"}, {"title": "Create project timeline"}]

Subtasks:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that breaks down tasks into clear subtasks. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content || '{"subtasks": []}')
    const subtasks = response.subtasks.map((subtask: { title: string }) => ({
      id: crypto.randomUUID(),
      title: subtask.title,
      completed: false
    }))

    return NextResponse.json({ subtasks })
  } catch (error) {
    console.error('Error generating subtasks:', error)
    return NextResponse.json(
      { error: 'Failed to generate subtasks' },
      { status: 500 }
    )
  }
} 