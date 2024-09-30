
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import SupabaseProvider from '@/components/supabase-provider';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ThemeProvider } from '@/components/theme-provider';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: { user },
  } = await supabase.auth.getUser();



  return (
    <html lang="en">
      <body suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}

      >
        <Toaster />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} >
          <SupabaseProvider>{children}</SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
