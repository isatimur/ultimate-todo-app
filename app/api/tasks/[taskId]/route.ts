import { NextRequest, NextResponse } from 'next/server'
import { ApiError, getAuthenticatedUser, verifyTaskOwnership } from '../taskUtils'

type Params = {
  params: {
    taskId: string
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { taskId } = params

  try {
    const { supabase, user } = await getAuthenticatedUser()
    const updates = await request.json()

    await verifyTaskOwnership(supabase, taskId, user.id)

    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { taskId } = params

  try {
    const { supabase, user } = await getAuthenticatedUser()

    await verifyTaskOwnership(supabase, taskId, user.id)

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

