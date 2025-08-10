import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST /api/v1/hooks/tasks - webhook endpoint to create or update tasks
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const supabase = await createClient();

  try {
    if (payload.action === 'update' && payload.id) {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...payload.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id);

      if (error) throw error;
    } else if (payload.action === 'create') {
      const { error } = await supabase
        .from('tasks')
        .insert({
          ...payload.data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook task error:', error);
    return NextResponse.json({ error: 'Task processing failed' }, { status: 500 });
  }
}
