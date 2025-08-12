import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async () => {
  const url = Deno.env.get('NEXT_PUBLIC_APP_URL')!
  const cronSecret = Deno.env.get('CRON_SECRET')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: { users } } = await supabase.auth.admin.listUsers()
  for (const user of users) {
    if (user.user_metadata?.daily_digest) {
      await fetch(`${url}/api/ai/daily-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`
        },
        body: JSON.stringify({ userId: user.id })
      })
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
