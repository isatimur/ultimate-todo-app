import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { createClient } from '@/lib/supabase-server'
import SessionProvider from '@/components/session-provider'
import ClientWrapper from '@/components/client-wrapper'
import { cn } from '@/lib/utils'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Ultimate Todo App',
  description: 'The most powerful todo app for professionals',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={cn(
      "min-h-screen bg-background font-sans antialiased",
      inter.variable
    )} suppressHydrationWarning>
      <body suppressHydrationWarning className="relative flex min-h-screen flex-col">
        <SessionProvider>
          <ClientWrapper initialUser={user}>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </ClientWrapper>
        </SessionProvider>
      </body>
    </html>
  );
}
