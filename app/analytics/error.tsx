'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Analytics error:', error)
  }, [error])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>Error Loading Analytics</CardTitle>
          <CardDescription>
            There was a problem loading your analytics data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred. Please try again later.'}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 