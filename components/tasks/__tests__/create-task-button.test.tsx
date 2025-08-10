import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateTaskButton } from '../create-task-button';

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>,
}));

describe('CreateTaskButton', () => {
  it('creates a task through the dialog', async () => {
    const onCreateTask = jest.fn().mockResolvedValue({ id: '1', title: 'New Task' });
    render(<CreateTaskButton onCreateTask={onCreateTask} />);

    fireEvent.click(screen.getByText('New Task'));
    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'New Task' } });
    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(onCreateTask).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Task' }));
    });
  });
});
