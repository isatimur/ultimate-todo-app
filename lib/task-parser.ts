import { Task } from '@/lib/types'
import { addDays, addWeeks, addMonths, parse, set, format } from 'date-fns'

interface ParsedDate {
  date: Date
  time?: string
}

export function parseTaskInput(input: string): Partial<Task> {
  if (!input.trim()) {
    throw new Error('Task input cannot be empty')
  }

  try {
    const lowercaseInput = input.toLowerCase()
    
    // Extract priority
    const priority = extractPriority(lowercaseInput)
    
    // Extract date and time
    const { date, time } = extractDateTime(lowercaseInput)
    if (!date) {
      throw new Error('Could not determine task date')
    }
    
    // Extract category
    const category = extractCategory(lowercaseInput)
    
    // Extract subtasks
    const subtasks = extractSubtasks(input)
    
    // Clean up the title by removing recognized parts
    const title = cleanupTitle(input)
    if (!title) {
      throw new Error('Task must have a title')
    }

    // Format the date consistently
    const formattedDate = format(date, 'yyyy-MM-dd')
    const formattedTime = time || '00:00'
    
    const taskData: Partial<Task> = {
      title,
      priority,
      category,
      due_date: `${formattedDate}T${formattedTime}:00.000Z`,
      start_time: formattedTime,
      status: 'To Do',
    }
    
    // Add subtasks if any were extracted
    if (subtasks.length > 0) {
      taskData.subtasks = subtasks
    }

    console.log('Parsed task data:', taskData)
    return taskData

  } catch (error) {
    console.error('Task parsing error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to parse task input')
  }
}

function extractPriority(input: string): Task['priority'] {
  if (input.includes('high priority') || input.includes('urgent') || input.includes('important')) {
    return 'High'
  }
  if (input.includes('medium priority') || input.includes('normal priority')) {
    return 'Medium'
  }
  if (input.includes('low priority')) {
    return 'Low'
  }
  return 'Medium' // default priority
}

function extractDateTime(input: string): ParsedDate {
  const now = new Date()
  let date = now
  let time: string | undefined
  
  // Handle relative dates
  if (input.includes('today')) {
    date = now
  } else if (input.includes('tomorrow')) {
    date = addDays(now, 1)
  } else if (input.includes('next week')) {
    date = addWeeks(now, 1)
  } else if (input.includes('next month')) {
    date = addMonths(now, 1)
  }
  
  // Extract time
  const timeMatch = input.match(/at (\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i)
  if (timeMatch) {
    const timeStr = timeMatch[1].toLowerCase()
    try {
      // Handle different time formats
      if (timeStr.includes(':')) {
        // Handle "HH:MM" format
        const [hours, minutesPart] = timeStr.split(':')
        const minutes = minutesPart.replace(/[^\d]/g, '')
        time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
      } else if (timeStr.includes('am') || timeStr.includes('pm')) {
        // Handle "H am/pm" format
        let hours = parseInt(timeStr)
        const isPM = timeStr.includes('pm')
        if (isPM && hours < 12) hours += 12
        if (!isPM && hours === 12) hours = 0
        time = `${hours.toString().padStart(2, '0')}:00`
      } else {
        // Handle 24-hour format
        time = `${timeStr.padStart(2, '0')}:00`
      }
    } catch (error) {
      console.error('Time parsing error:', error)
      time = '00:00'
    }
  }
  
  return { date, time }
}

function extractCategory(input: string): Task['category'] {
  if (input.includes('work') || input.includes('presentation') || input.includes('meeting')) {
    return 'Work'
  }
  if (input.includes('personal') || input.includes('home')) {
    return 'Personal'
  }
  if (input.includes('errands') || input.includes('shopping')) {
    return 'Errands'
  }
  return 'Personal' // default category
}

/**
 * Extract subtasks from the input string
 * Looks for common patterns like lists with "and", bullet points, or numbered items
 */
function extractSubtasks(input: string): string[] {
  const subtasks: string[] = []
  
  // Pattern 1: Items separated by "and"
  // Example: "Buy milk and eggs and bread"
  if (input.includes(' and ')) {
    const andPattern = /(?:to|need to|must|should)?\s+(.+?)(?:\s+and\s+)(.+?)(?:\s+(?:by|at|tomorrow|today|next|on|before)|\s*$)/i
    const andMatch = input.match(andPattern)
    
    if (andMatch && andMatch[1] && andMatch[2]) {
      // Check if we have a verb-noun pattern that suggests a list
      const firstItem = andMatch[1].trim()
      const restItems = andMatch[2].trim().split(/\s+and\s+/)
      
      // Only extract if the first word is a verb (simple heuristic)
      const firstWord = firstItem.split(' ')[0].toLowerCase()
      const commonVerbs = ['buy', 'get', 'pick', 'call', 'email', 'write', 'prepare', 'make', 'finish', 'complete']
      
      if (commonVerbs.includes(firstWord)) {
        subtasks.push(firstItem)
        restItems.forEach(item => subtasks.push(item))
      }
    }
  }
  
  // Pattern 2: Bullet points or numbered items
  // Example: "Project tasks: 1. Research competitors 2. Draft proposal"
  const bulletPattern = /(?:[-•*]|\d+\.)\s+([^-•*\d\.][^\n]+)/g
  let bulletMatch
  while ((bulletMatch = bulletPattern.exec(input)) !== null) {
    subtasks.push(bulletMatch[1].trim())
  }
  
  // Pattern 3: Items separated by commas in a list context
  // Example: "Shopping list: milk, eggs, bread"
  const listContexts = ['list', 'items', 'tasks', 'steps']
  for (const context of listContexts) {
    if (input.toLowerCase().includes(context)) {
      const listPattern = new RegExp(`${context}\\s*:?\\s*([^:]+)(?:\\s+(?:by|at|tomorrow|today|next|on|before)|$)`, 'i')
      const listMatch = input.match(listPattern)
      
      if (listMatch && listMatch[1]) {
        const items = listMatch[1].split(',').map(item => item.trim())
        if (items.length > 1) {
          items.forEach(item => {
            if (item && !subtasks.includes(item)) {
              subtasks.push(item)
            }
          })
        }
      }
    }
  }
  
  return subtasks
}

function cleanupTitle(input: string): string {
  // Remove common phrases used for metadata
  const phrasesToRemove = [
    /high priority/i,
    /medium priority/i,
    /low priority/i,
    /urgent/i,
    /important/i,
    /tomorrow/i,
    /today/i,
    /next week/i,
    /next month/i,
    /at \d{1,2}(?::\d{2})?(?:\s*[ap]m)?/i,
  ]
  
  let title = input
  phrasesToRemove.forEach(phrase => {
    title = title.replace(phrase, '')
  })
  
  // Clean up extra spaces and capitalize first letter
  title = title.trim().replace(/\s+/g, ' ')
  return title.charAt(0).toUpperCase() + title.slice(1)
} 