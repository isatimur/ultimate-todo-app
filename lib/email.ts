import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: EmailOptions) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    if (!to || !subject || !html) {
        throw new Error('Missing required email parameters');
    }

    try {
        // In development, send all emails to the test email
        const isDevelopment = process.env.NODE_ENV === 'development';
        const testEmail = process.env.NEXT_PUBLIC_TEST_EMAIL;
        
        if (isDevelopment && !testEmail) {
            throw new Error('NEXT_PUBLIC_TEST_EMAIL is required in development mode');
        }

        const emailOptions = {
            from: 'onboarding@todo-list.ai', // This is the only allowed address in test mode
            to: isDevelopment ? testEmail! : to,
            subject: isDevelopment ? `${subject}` : subject,
            html,
            reply_to: replyTo,
            tags: [{ name: 'category', value: 'todo-app' }],
        };

        console.log('Sending email with options:', {
            ...emailOptions,
            html: 'HTML content hidden for logging'
        });

        const { data, error } = await resend.emails.send(emailOptions);

        if (error) {
            console.error('Resend API error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email sending error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Failed to send email' 
        };
    }
}

export function getInvitationEmailTemplate(teamName: string, inviterName: string, inviteLink: string) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Team Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Ultimate Todo App" style="height: 40px;">
                </div>
                <h2 style="color: #1a1a1a; margin-bottom: 20px;">Join ${teamName} on Ultimate Todo App</h2>
                <p style="color: #4a5568; line-height: 1.6;">Hello!</p>
                <p style="color: #4a5568; line-height: 1.6;">${inviterName} has invited you to join their team "${teamName}" on Ultimate Todo App.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${inviteLink}" 
                       style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
                        Accept Invitation
                    </a>
                </div>
                <p style="color: #718096; font-size: 14px;">This invitation link will expire in 7 days.</p>
                <p style="color: #718096; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #718096; font-size: 14px; text-align: center;">
                    Best regards,<br>Ultimate Todo App Team
                </p>
            </div>
        </body>
        </html>
    `;
}

export function getTaskAssignmentEmailTemplate(taskTitle: string, assignerName: string, taskLink: string) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Task Assignment</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Ultimate Todo App" style="height: 40px;">
                </div>
                <h2 style="color: #1a1a1a; margin-bottom: 20px;">New Task Assignment</h2>
                <p style="color: #4a5568; line-height: 1.6;">Hello!</p>
                <p style="color: #4a5568; line-height: 1.6;">${assignerName} has assigned you a new task: "${taskTitle}"</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${taskLink}" 
                       style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
                        View Task
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #718096; font-size: 14px; text-align: center;">
                    Best regards,<br>Ultimate Todo App Team
                </p>
            </div>
        </body>
        </html>
    `;
}

export function getTaskDueReminderTemplate(taskTitle: string, dueDate: string, taskLink: string) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Task Due Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="Ultimate Todo App" style="height: 40px;">
                </div>
                <h2 style="color: #1a1a1a; margin-bottom: 20px;">Task Due Reminder</h2>
                <p style="color: #4a5568; line-height: 1.6;">Hello!</p>
                <p style="color: #4a5568; line-height: 1.6;">This is a reminder that the task "${taskTitle}" is due on ${dueDate}.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${taskLink}" 
                       style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
                        View Task
                    </a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #718096; font-size: 14px; text-align: center;">
                    Best regards,<br>Ultimate Todo App Team
                </p>
            </div>
        </body>
        </html>
    `;
} 