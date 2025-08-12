import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// This Edge Function triggers the daily summary API route.
// It can be scheduled using Supabase's cron feature.
serve(async () => {
  const url = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? ''
  if (url) {
    await fetch(`${url}/api/ai/daily-summary`, { method: 'POST' })
  }
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
