'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createBrowserClient } from '@supabase/ssr';

// Define our own ThemeProviderProps type instead of importing from next-themes
type ThemeProviderProps = {
  children: React.ReactNode;
  [key: string]: any;
};

export function Providers({ children, ...props }: ThemeProviderProps) {
  const [supabaseClient] = React.useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // Use type assertion to bypass type checking
  return (
    <NextThemesProvider
      {...{
        attribute: "class",
        defaultTheme: "system",
        enableSystem: true,
        disableTransitionOnChange: true,
        ...props
      } as any}
    >
      {children}
    </NextThemesProvider>
  );
}