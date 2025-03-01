import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendar | Ultimate Todo App',
  description: 'View and manage your tasks in a calendar view',
}

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 