import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    // Convert Blob to File object
    const file = new File([audioFile], 'audio.webm', { type: audioFile.type })

    // Transcribe using OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    })

    return NextResponse.json({ text: transcription.text })
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