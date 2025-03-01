import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamWorkspace } from '@/components/teams/team-workspace';

describe('Team Collaboration', () => {
    it('should allow real-time task updates', async () => {
        render(<TeamWorkspace team={mockTeam} members={mockMembers} />);
        
        const taskInput = screen.getByPlaceholderText('Add a new task');
        fireEvent.change(taskInput, { target: { value: 'New task' } });
        fireEvent.keyPress(taskInput, { key: 'Enter', code: 13 });

        await waitFor(() => {
            expect(screen.getByText('New task')).toBeInTheDocument();
        });
    });
}); 