import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET /api/v1/user/settings - fetch settings for authenticated user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT /api/v1/user/settings - update settings for authenticated user
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = await request.json();

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      id: user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
