import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import openai from '@/lib/openai'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's AI settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ai_settings')
      .eq('user_id', user.id)
      .single()
    
    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 })
    }

    return NextResponse.json({ settings: settings?.ai_settings || {} })
  } catch (error) {
    console.error('Error in AI settings endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { prompt, settings } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: settings.model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for a todo app. You can help with task management, productivity tips, and general questions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: settings.temperature || 0.7,
      max_tokens: settings.maxTokens || 2000
    })

    const response = completion.choices[0]?.message?.content || 'No response generated'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in AI endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
} 