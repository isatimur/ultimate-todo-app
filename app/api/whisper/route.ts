import { NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/ai/transcription'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    const text = await transcribeAudio(audioFile)

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Error in Whisper API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process audio',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Helper function to check API key
export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    )
  }
  return NextResponse.json({ status: 'OpenAI Whisper API is configured' })
} 