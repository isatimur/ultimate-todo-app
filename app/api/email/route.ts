import { NextResponse } from 'next/server';
import { sendEmail, buildTeamInvitationEmail, buildTaskAssignmentEmail, buildDueReminderEmail } from '@/lib/email';
import { emailSchema } from './validation';
import { authenticateRequest } from '@/lib/api/authenticateRequest';

export async function POST(req: Request) {
    try {
        const { user, error: authError } = await authenticateRequest();

        if (authError || !user) {
            console.error('Authentication error:', authError);
            return NextResponse.json(
                { error: 'Unauthorized access', details: authError?.message },
                { status: 401 }
            );
        }

        const body = await req.json();
        console.log('Received email request:', {
            ...body,
            data: {
                ...body.data,
                html: body.data?.html ? '[HIDDEN]' : undefined
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
            case 'team_invitation':
                emailOptions = buildTeamInvitationEmail(data, user.email);
                break;
            case 'task_assignment':
                emailOptions = buildTaskAssignmentEmail(data, user.email);
                break;
            case 'task_due_reminder':
                emailOptions = buildDueReminderEmail(data);
                break;
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
