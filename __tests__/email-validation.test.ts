import { describe, expect, it } from 'vitest';
import { emailSchema } from '../app/api/email/validation';

describe('email validation', () => {
    it('validates team invitation', () => {
        const payload = {
            type: 'team_invitation',
            data: {
                teamName: 'A-Team',
                inviterName: 'Alice',
                inviteLink: 'https://example.com/invite',
                recipientEmail: 'bob@example.com'
            }
        };
        expect(() => emailSchema.parse(payload)).not.toThrow();
    });

    it('rejects invalid task assignment', () => {
        const payload = {
            type: 'task_assignment',
            data: {
                taskTitle: 'Task 1',
                assignerName: 'Alice',
                taskLink: 'not-a-url',
                assigneeEmail: 'bob@example.com'
            }
        };
        const result = emailSchema.safeParse(payload);
        expect(result.success).toBe(false);
    });

    it('validates task due reminder', () => {
        const payload = {
            type: 'task_due_reminder',
            data: {
                taskTitle: 'Task 1',
                dueDate: '2024-01-01',
                taskLink: 'https://example.com/task',
                userEmail: 'bob@example.com'
            }
        };
        expect(emailSchema.parse(payload)).toEqual(payload);
    });
});
