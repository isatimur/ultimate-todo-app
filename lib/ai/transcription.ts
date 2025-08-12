import openai from '@/lib/openai'

export async function transcribeAudio(audio: Blob): Promise<string> {
  const file = new File([audio], 'audio.webm', { type: audio.type })
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  })
  return transcription.text
}
