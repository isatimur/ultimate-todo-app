"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function PageContainer({ 
  children, 
  className,
  fullWidth = false
}: PageContainerProps) {
  return (
    <div className={cn(
      "flex-1 overflow-y-auto bg-background",
      className
    )}>
      <div className={cn(
        "py-6 px-4 sm:px-6 lg:px-8 mx-auto h-full",
        fullWidth ? "w-full" : "max-w-5xl"
      )}>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  children,
  className
}: {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          {children}
        </div>
      )}
    </div>
  )
} 