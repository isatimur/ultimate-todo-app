import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({
    required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'
  })
})

const envResult = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
})

if (!envResult.success) {
  const missing = Object.entries(envResult.error.flatten().fieldErrors)
    .map(([key, value]) => `${key}${value ? `: ${value.join(', ')}` : ''}`)
    .join('\n')
  const message = `Missing or invalid environment variables:\n${missing}`
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(message)
  } else {
    console.error(message)
  }
}

export const env = envResult.success
  ? envResult.data
  : ({} as z.infer<typeof envSchema>)

