import { describe, expect, it } from 'vitest';
import { buildTeamInvitationEmail, buildTaskAssignmentEmail, buildDueReminderEmail } from '../lib/email';

describe('email builders', () => {
    it('builds team invitation email', () => {
        const data = {
            teamName: 'A-Team',
            inviterName: 'Alice',
            inviteLink: 'https://example.com/invite',
            recipientEmail: 'bob@example.com'
        };
        const result = buildTeamInvitationEmail(data, 'alice@example.com');
        expect(result.to).toBe('bob@example.com');
        expect(result.subject).toBe('Invitation to join A-Team on Ultimate Todo App');
        expect(result.replyTo).toBe('alice@example.com');
        expect(result.html).toContain('Join A-Team on Ultimate Todo App');
    });

    it('builds task assignment email', () => {
        const data = {
            taskTitle: 'Task 1',
            assignerName: 'Alice',
            taskLink: 'https://example.com/task',
            assigneeEmail: 'bob@example.com'
        };
        const result = buildTaskAssignmentEmail(data, 'alice@example.com');
        expect(result.to).toBe('bob@example.com');
        expect(result.subject).toBe('New Task Assignment: Task 1');
        expect(result.replyTo).toBe('alice@example.com');
        expect(result.html).toContain('Task 1');
    });

    it('builds task due reminder email', () => {
        const data = {
            taskTitle: 'Task 1',
            dueDate: '2024-01-01',
            taskLink: 'https://example.com/task',
            userEmail: 'bob@example.com'
        };
        const result = buildDueReminderEmail(data);
        expect(result.to).toBe('bob@example.com');
        expect(result.subject).toBe('Task Due Reminder: Task 1');
        expect(result.html).toContain('Task Due Reminder');
    });
});
