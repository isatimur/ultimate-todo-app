import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as Blob

    if (!image) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await image.arrayBuffer())
    const base64 = buffer.toString('base64')

    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract the text from this image.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:${image.type};base64,${base64}`,
              },
            },
          ],
        },
      ],
    })

    const text = result.choices[0].message?.content || ''
    return NextResponse.json({ text })
  } catch (error) {
    console.error('Error in Vision API:', error)
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    )
  }
  return NextResponse.json({ status: 'OpenAI Vision API is configured' })
}
