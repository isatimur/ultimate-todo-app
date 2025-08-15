import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { goal } = await request.json()

    const prompt = `You are an expert project planner. Break the following goal into a structured plan with tasks and subtasks.

Goal: "${goal}"

Return a JSON object with a 'tasks' array. Each task should have a 'title' and an optional 'tasks' array for subtasks.
Example: {"tasks":[{"title":"Task A","tasks":[{"title":"Subtask"}]}]}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You create detailed project plans as nested tasks. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    })

    const plan = JSON.parse(completion.choices[0].message.content || '{"tasks": []}')
    return NextResponse.json(plan)
  } catch (error) {
    console.error('Error planning project:', error)
    return NextResponse.json(
      { error: 'Failed to plan project' },
      { status: 500 }
    )
  }
}
