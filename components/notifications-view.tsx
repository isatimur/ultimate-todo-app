"use client"

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Bell, Check, Trash2 } from 'lucide-react'

interface Notification {
  id: string
  user_id: string
  type: string
  data: Record<string, any>
  read: boolean
  created_at: string
}

interface NotificationsViewProps {
  userId: string
}

export function NotificationsView({ userId }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      toast.success('Marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      )
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'task_assigned':
        return {
          title: 'Task Assigned',
          description: `You have been assigned to "${notification.data.taskTitle}"`
        }
      case 'task_completed':
        return {
          title: 'Task Completed',
          description: `Task "${notification.data.taskTitle}" has been completed`
        }
      case 'team_invitation':
        return {
          title: 'Team Invitation',
          description: `You have been invited to join team "${notification.data.teamName}"`
        }
      case 'comment_added':
        return {
          title: 'New Comment',
          description: `New comment on task "${notification.data.taskTitle}"`
        }
      default:
        return {
          title: 'Notification',
          description: 'You have a new notification'
        }
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Notifications</CardTitle>
        <CardDescription>Stay updated with your tasks and team activities</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No notifications</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const content = getNotificationContent(notification)
                return (
                  <Card
                    key={notification.id}
                    className={`p-4 ${notification.read ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{content.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {content.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {!notification.read && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 