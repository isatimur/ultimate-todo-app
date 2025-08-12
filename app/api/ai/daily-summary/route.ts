import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { createClient } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/email'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    let tasks: { title: string; status: string }[] | undefined = body.tasks
    let email: string | undefined = body.email

    if (!tasks) {
      const supabase = await createClient()
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      email = user.email
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('tasks')
        .select('title, status')
        .eq('user_id', user.id)
        .eq('due_date', today)

      if (error) throw error
      tasks = data || []
    }

    const taskLines = (tasks || [])
      .map((t) => `- ${t.title} (${t.status})`)
      .join('\n')

    const prompt = `Summarize the following tasks for a brief daily digest:\n${taskLines}\nSummary:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes task lists.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 150
    })

    const summary = completion.choices[0].message.content?.trim() || ''

    if (email && summary) {
      const html = `<p>${summary}</p>`
      try {
        await sendEmail({
          to: email,
          subject: 'Daily Task Summary',
          html
        })
      } catch (err) {
        console.error('Failed to send summary email:', err)
      }
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating daily summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}

