import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog';
import type { Task } from '@/lib/types';

const eqMock = jest.fn().mockResolvedValue({ error: null });
const updateMock = jest.fn(() => ({ eq: eqMock }));

jest.mock('@/lib/supabase-browser', () => ({
  createClient: () => ({
    from: () => ({ update: updateMock })
  })
}));

describe('Task editing flow', () => {
  const task = { id: '1', title: 'Old', status: 'To Do', priority: 'Low' } as Task;

  it('updates task title', async () => {
    const onOpenChange = jest.fn();
    render(
      <EditTaskDialog task={task} open={true} onOpenChange={onOpenChange} onSave={jest.fn()} />
    );

    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalled();
      expect(eqMock).toHaveBeenCalledWith('id', task.id);
    });
  });
});
