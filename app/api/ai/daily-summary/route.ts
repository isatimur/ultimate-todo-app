import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { OpenAI } from 'openai'
import { sendEmail } from '@/lib/email'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface Task {
  title: string
  status: string
  due_date: string
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
    let supabase: any
    let userId: string
    let userEmail: string | undefined

    if (isCron) {
      const { userId: bodyUserId } = await req.json()
      if (!bodyUserId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 })
      }
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 })
      }
      supabase = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      const { data: userData } = await supabase.auth.admin.getUserById(bodyUserId)
      if (!userData.user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      userId = bodyUserId
      userEmail = userData.user.email || undefined
    } else {
      supabase = await createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
      userEmail = user.email || undefined
    }

    // Allow tests to pass custom tasks; otherwise fetch today's tasks
    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      // ignore
    }
    let tasks: Task[] = body.tasks ?? []

    if (body.tasks === undefined) {
      const start = new Date()
      start.setUTCHours(0, 0, 0, 0)
      const end = new Date()
      end.setUTCHours(23, 59, 59, 999)

      const { data: fetchedTasks, error: taskError } = await supabase
        .from('tasks')
        .select('title,status,due_date')
        .eq('user_id', userId)
        .gte('due_date', start.toISOString())
        .lt('due_date', end.toISOString())

      if (taskError) {
        console.error('Error fetching tasks:', taskError)
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
      }
      tasks = fetchedTasks || []
    }

    const taskText = tasks.length
      ? tasks.map(t => `- ${t.title} (${t.status})`).join('\n')
      : 'No tasks for today.'

    const prompt = `Provide a concise daily summary for these tasks:\n${taskText}\nKeep it short and encouraging.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7
    })

    const summary = completion.choices[0].message?.content?.trim() || 'No summary available.'

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: 'Your Daily Task Summary',
        html: `<p>${summary}</p>`
      })
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating daily summary:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}

