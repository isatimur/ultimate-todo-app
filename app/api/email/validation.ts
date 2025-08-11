import { z } from 'zod';

export const emailBaseSchema = z.object({
    type: z.enum(['team_invitation', 'task_assignment', 'task_due_reminder']),
});

export const teamInvitationSchema = emailBaseSchema.extend({
    type: z.literal('team_invitation'),
    data: z.object({
        teamName: z.string(),
        inviterName: z.string(),
        inviteLink: z.string().url(),
        recipientEmail: z.string().email(),
    }),
});

export const taskAssignmentSchema = emailBaseSchema.extend({
    type: z.literal('task_assignment'),
    data: z.object({
        taskTitle: z.string(),
        assignerName: z.string(),
        taskLink: z.string().url(),
        assigneeEmail: z.string().email(),
    }),
});

export const taskDueReminderSchema = emailBaseSchema.extend({
    type: z.literal('task_due_reminder'),
    data: z.object({
        taskTitle: z.string(),
        dueDate: z.string(),
        taskLink: z.string().url(),
        userEmail: z.string().email(),
    }),
});

export const emailSchema = z.discriminatedUnion('type', [
    teamInvitationSchema,
    taskAssignmentSchema,
    taskDueReminderSchema,
]);

export type EmailRequest = z.infer<typeof emailSchema>;
