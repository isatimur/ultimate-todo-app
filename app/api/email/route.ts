import { NextResponse } from 'next/server';
import { sendEmail, getInvitationEmailTemplate, getTaskAssignmentEmailTemplate, getTaskDueReminderTemplate } from '@/lib/email';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Validation schemas
const emailBaseSchema = z.object({
    type: z.enum(['team_invitation', 'task_assignment', 'task_due_reminder']),
});

const teamInvitationSchema = emailBaseSchema.extend({
    type: z.literal('team_invitation'),
    data: z.object({
        teamName: z.string(),
        inviterName: z.string(),
        inviteLink: z.string().url(),
        recipientEmail: z.string().email(),
    }),
});

const taskAssignmentSchema = emailBaseSchema.extend({
    type: z.literal('task_assignment'),
    data: z.object({
        taskTitle: z.string(),
        assignerName: z.string(),
        taskLink: z.string().url(),
        assigneeEmail: z.string().email(),
    }),
});

const taskDueReminderSchema = emailBaseSchema.extend({
    type: z.literal('task_due_reminder'),
    data: z.object({
        taskTitle: z.string(),
        dueDate: z.string(),
        taskLink: z.string().url(),
        userEmail: z.string().email(),
    }),
});

const emailSchema = z.discriminatedUnion('type', [
    teamInvitationSchema,
    taskAssignmentSchema,
    taskDueReminderSchema,
]);

export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        // Verify authentication
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: any) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // Handle cookie errors in development
                        }
                    },
                    remove(name: string, options: any) {
                        try {
                            cookieStore.delete({ name, ...options });
                        } catch (error) {
                            // Handle cookie errors in development
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.error('Authentication error:', authError);
            return NextResponse.json(
                { error: 'Unauthorized access', details: authError?.message },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await req.json();
        console.log('Received email request:', {
            ...body,
            data: {
                ...body.data,
                html: body.data.html ? '[HIDDEN]' : undefined
            }
        });

        const validationResult = emailSchema.safeParse(body);

        if (!validationResult.success) {
            console.error('Validation error:', validationResult.error.format());
            return NextResponse.json(
                { 
                    error: 'Invalid request data', 
                    details: validationResult.error.format() 
                },
                { status: 400 }
            );
        }

        const { type, data } = validationResult.data;
        let emailOptions;

        switch (type) {
            case 'team_invitation': {
                const { teamName, inviterName, inviteLink, recipientEmail } = data;
                emailOptions = {
                    to: recipientEmail,
                    subject: `Invitation to join ${teamName} on Ultimate Todo App`,
                    html: getInvitationEmailTemplate(teamName, inviterName, inviteLink),
                    replyTo: user.email,
                };
                break;
            }

            case 'task_assignment': {
                const { taskTitle, assignerName, taskLink, assigneeEmail } = data;
                emailOptions = {
                    to: assigneeEmail,
                    subject: `New Task Assignment: ${taskTitle}`,
                    html: getTaskAssignmentEmailTemplate(taskTitle, assignerName, taskLink),
                    replyTo: user.email,
                };
                break;
            }

            case 'task_due_reminder': {
                const { taskTitle, dueDate, taskLink, userEmail } = data;
                emailOptions = {
                    to: userEmail,
                    subject: `Task Due Reminder: ${taskTitle}`,
                    html: getTaskDueReminderTemplate(taskTitle, dueDate, taskLink),
                };
                break;
            }
        }

        console.log('Preparing to send email with options:', {
            ...emailOptions,
            html: '[HIDDEN]'
        });

        const result = await sendEmail(emailOptions);

        if (!result.success) {
            console.error('Failed to send email:', result.error);
            return NextResponse.json(
                { 
                    error: 'Failed to send email', 
                    details: result.error,
                    emailOptions: {
                        ...emailOptions,
                        html: '[HIDDEN]'
                    }
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            data: result.data,
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('Error in email API route:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
            },
            { status: 500 }
        );
    }
} 