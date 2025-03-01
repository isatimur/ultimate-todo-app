import { format, addMinutes, parseISO, isToday as dateFnsIsToday } from 'date-fns'
import { enUS } from 'date-fns/locale'

/**
 * Base date for consistent time formatting across server/client
 * Using January 1, 2000 as a fixed reference point
 */
export const BASE_DATE = new Date(2000, 0, 1)

/**
 * Formats a date as a header (e.g., "Monday, January 1")
 * 
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatHeaderDate(date: Date): string {
  return format(date, "EEEE, MMMM d", { locale: enUS })
}

/**
 * Formats a time (hours and minutes) consistently
 * 
 * @param hours - Hours component (0-23)
 * @param minutes - Minutes component (0-59)
 * @returns Formatted time string (e.g., "09:30")
 */
export function formatTime(hours: number, minutes: number): string {
  const timeDate = new Date(BASE_DATE)
  timeDate.setHours(hours, minutes)
  return format(timeDate, 'HH:mm', { locale: enUS })
}

/**
 * Formats a time range (start and end times)
 * 
 * @param startTime - Start time in "HH:mm" format
 * @param durationMinutes - Duration in minutes
 * @returns Formatted time range (e.g., "09:00 - 10:30")
 */
export function formatTimeRange(startTime: string, durationMinutes: number): string {
  if (!startTime) return ''
  
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date(BASE_DATE)
  startDate.setHours(hours, minutes)
  
  const endDate = addMinutes(startDate, durationMinutes)
  
  return `${format(startDate, 'HH:mm', { locale: enUS })} - ${format(endDate, 'HH:mm', { locale: enUS })}`
}

/**
 * Formats a date in a consistent way (e.g., "Jan 1, 2023")
 * 
 * @param date - The date to format (Date object or ISO string)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM d, yyyy', { locale: enUS })
}

/**
 * Calculates duration in minutes between start and end times
 * 
 * @param startTime - Start time in "HH:mm" format
 * @param endTime - End time in "HH:mm" format
 * @returns Duration in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 30 // default duration
  
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}

/**
 * Formats duration in minutes to a human-readable string
 * 
 * @param durationMinutes - Duration in minutes
 * @returns Formatted duration (e.g., "1h 30m")
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/**
 * Checks if a date is today
 * Wrapper around date-fns isToday for consistent usage
 * 
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateFnsIsToday(dateObj)
}

/**
 * Gets the time slot (0-47) for a given time
 * Each slot represents a 30-minute interval (0 = 00:00, 1 = 00:30, etc.)
 * 
 * @param time - Time in "HH:mm" format
 * @returns Time slot number
 */
export function getTimeSlot(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 2 + (minutes >= 30 ? 1 : 0)
}

/**
 * Gets the time from a time slot
 * 
 * @param timeSlot - Time slot (0-47)
 * @returns Time in "HH:mm" format
 */
export function getTimeFromSlot(timeSlot: number): string {
  const hours = Math.floor(timeSlot / 2)
  const minutes = (timeSlot % 2) * 30
  return formatTime(hours, minutes)
} 