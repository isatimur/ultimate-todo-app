import { NextResponse } from 'next/server'
import openai from '@/lib/openai'

export async function POST(request: Request) {
  try {
    const { title, currentDescription } = await request.json()

    const prompt = `Write a clear and concise task description for a task titled "${title}". ${
      currentDescription ? `The current description is: "${currentDescription}". Please improve it.` : ''
    }
    
    The description should:
    1. Explain the purpose and expected outcome
    2. Include any relevant context
    3. Be professional and actionable
    4. Be between 2-4 sentences
    
    Description:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that writes clear and concise task descriptions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })

    const description = completion.choices[0].message.content?.trim()

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
} 