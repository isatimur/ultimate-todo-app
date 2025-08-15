export type EmailType = 'team_invitation' | 'task_assignment' | 'task_due_reminder';

export interface TeamInvitationData {
  teamName: string;
  inviterName: string;
  inviteLink: string;
  recipientEmail: string;
}

export interface TaskAssignmentData {
  taskTitle: string;
  assignerName: string;
  taskLink: string;
  assigneeEmail: string;
}

export interface TaskDueReminderData {
  taskTitle: string;
  dueDate: string;
  taskLink: string;
  userEmail: string;
}

export type EmailPayload =
  | { type: 'team_invitation'; data: TeamInvitationData }
  | { type: 'task_assignment'; data: TaskAssignmentData }
  | { type: 'task_due_reminder'; data: TaskDueReminderData };

export interface SendEmailResult {
  success: boolean;
  message: string;
}

export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  const response = await fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // ignore parse errors
  }

  if (!response.ok) {
    return {
      success: false,
      message: data?.error || data?.message || 'Failed to send email'
    };
  }

  return {
    success: true,
    message: data?.message || 'Email sent successfully'
  };
}
