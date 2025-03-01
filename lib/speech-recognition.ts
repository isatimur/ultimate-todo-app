export class SpeechRecognitionService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private isRecording = false

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        } 
      })

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })

      this.audioChunks = []
      this.isRecording = true

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
    } catch (error) {
      console.error('Error starting recording:', error)
      this.isRecording = false
      throw new Error('Could not access microphone. Please check permissions.')
    }
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
          
          // Check file size
          if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit for Whisper API
            throw new Error('Recording too long. Please keep it under 1 minute.')
          }

          const formData = new FormData()
          formData.append('audio', audioBlob)

          const response = await fetch('/api/whisper', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to transcribe audio')
          }

          const { text } = await response.json()
          resolve(text)
        } catch (error) {
          console.error('Error processing audio:', error)
          reject(error)
        } finally {
          this.cleanup()
        }
      }

      this.mediaRecorder.stop()
      this.isRecording = false
    })
  }

  private cleanup(): void {
    if (this.mediaRecorder?.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
    this.mediaRecorder = null
    this.audioChunks = []
    this.isRecording = false
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }
} 