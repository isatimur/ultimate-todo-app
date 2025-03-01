export type NotificationType = 
    | 'task_assigned'
    | 'task_completed'
    | 'comment_added'
    | 'due_date_approaching'
    | 'team_invite';

interface Notification {
    id: string;
    type: NotificationType;
    userId: string;
    data: Record<string, any>;
    read: boolean;
    createdAt: string;
}

export async function createNotification(
    type: NotificationType,
    userId: string,
    data: Record<string, any>
): Promise<void> {
    await supabase.from('notifications').insert({
        type,
        user_id: userId,
        data,
        read: false
    });
} 