import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { CreateTaskButton } from '@/components/tasks/create-task-button';
import type { Task } from '@/lib/types';

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>,
}));

function Wrapper() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const handleCreate = async (task: Partial<Task>) => {
    const newTask = { id: Math.random().toString(), title: task.title || '', status: 'To Do', priority: 'Medium' } as Task;
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };
  return (
    <div>
      <CreateTaskButton onCreateTask={handleCreate} />
      <ul>
        {tasks.map(t => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
    </div>
  );
}

describe('Task creation flow', () => {
  it('adds a task to the list', async () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByText('New Task'));
    fireEvent.change(screen.getByPlaceholderText('Task title'), { target: { value: 'Integration Task' } });
    fireEvent.click(screen.getByText('Create Task'));
    await waitFor(() => {
      expect(screen.getByText('Integration Task')).toBeInTheDocument();
    });
  });
});
