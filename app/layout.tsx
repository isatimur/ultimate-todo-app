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

  const swRegisterScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? `
            applicationServerKey: urlBase64ToUint8Array('${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}'),` : ''}
          });
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          });
        }
      }
    } catch (err) {
      console.error('Service worker registration failed', err);
    }
  });
}
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
`

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
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </body>
    </html>
  );
}
